'use server'

import { prisma } from '@/lib/prisma'
import { collectionSchema } from '@/lib/validations/facturacion'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import { createJournalEntry } from '@/lib/services/accounting.service'
import Decimal from 'decimal.js'

interface ApplicationInput {
  invoiceId: string
  amount: string
}

export async function createCollection(data: {
  collectionDate: string
  paymentMethod: 'CASH' | 'CHECK' | 'TRANSFER' | 'CREDIT_CARD'
  bankAccount?: string | null
  reference?: string | null
  notes?: string | null
  applications: ApplicationInput[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate header
  const header = collectionSchema.parse({
    collectionDate: data.collectionDate,
    paymentMethod: data.paymentMethod,
    bankAccount: data.bankAccount || null,
    reference: data.reference || null,
    notes: data.notes || null,
  })

  if (!data.applications || data.applications.length === 0) {
    throw new Error('Debe aplicar el cobro a al menos una factura')
  }

  // Validate applications
  let totalAmount = new Decimal(0)
  const validatedApplications: { invoiceId: string; amount: Decimal }[] = []

  for (const app of data.applications) {
    const amount = new Decimal(app.amount)
    if (amount.lte(0)) {
      throw new Error('El monto de la aplicacion debe ser mayor a 0')
    }

    const invoice = await prisma.clientInvoice.findUnique({
      where: { id: app.invoiceId },
    })
    if (!invoice) throw new Error(`Factura no encontrada: ${app.invoiceId}`)
    if (invoice.status !== 'ISSUED' && invoice.status !== 'PARTIALLY_PAID') {
      throw new Error(`Factura ${invoice.number} no esta disponible para cobro`)
    }

    const balance = new Decimal(invoice.balanceDue.toString())
    if (amount.gt(balance)) {
      throw new Error(`El monto aplicado (${amount.toFixed(2)}) excede el balance de la factura ${invoice.number} (${balance.toFixed(2)})`)
    }

    totalAmount = totalAmount.plus(amount)
    validatedApplications.push({ invoiceId: app.invoiceId, amount })
  }

  const number = await generateSequentialNumber(prisma, 'COLLECTION', 'COB')

  // Create journal entry: debit Bank, credit AR
  let journalEntryId: string | null = null
  const bankAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '1.1.01' }, acceptsEntries: true, isActive: true },
  })
  const arAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '1.1.03' }, acceptsEntries: true, isActive: true },
  })

  if (bankAccount && arAccount) {
    journalEntryId = await createJournalEntry({
      date: new Date(header.collectionDate),
      description: `Cobro ${number}`,
      type: 'AUTOMATIC',
      referenceType: 'Collection',
      referenceId: number,
      reference: number,
      lines: [
        {
          accountId: bankAccount.id,
          description: `Cobro recibido - ${number}`,
          debit: totalAmount.toFixed(2),
          credit: '0',
        },
        {
          accountId: arAccount.id,
          description: `Aplicacion cobro - ${number}`,
          debit: '0',
          credit: totalAmount.toFixed(2),
        },
      ],
    })
  }

  // Create collection with applications in transaction
  await prisma.$transaction(async (tx) => {
    const collection = await tx.collection.create({
      data: {
        number,
        collectionDate: new Date(header.collectionDate),
        paymentMethod: header.paymentMethod,
        bankAccount: header.bankAccount || null,
        reference: header.reference || null,
        totalAmount: totalAmount.toFixed(2),
        notes: header.notes || null,
        journalEntryId,
        applications: {
          create: validatedApplications.map((app) => ({
            invoiceId: app.invoiceId,
            amount: app.amount.toFixed(2),
          })),
        },
      },
    })

    // Update invoice balances and statuses
    for (const app of validatedApplications) {
      const invoice = await tx.clientInvoice.findUnique({
        where: { id: app.invoiceId },
      })
      if (!invoice) continue

      const currentBalance = new Decimal(invoice.balanceDue.toString())
      const newBalance = currentBalance.minus(app.amount)

      let newStatus = invoice.status
      if (newBalance.lte(0)) {
        newStatus = 'PAID'
      } else if (newBalance.lt(new Decimal(invoice.totalAmount.toString()))) {
        newStatus = 'PARTIALLY_PAID'
      }

      await tx.clientInvoice.update({
        where: { id: app.invoiceId },
        data: {
          balanceDue: newBalance.toFixed(2),
          status: newStatus,
        },
      })
    }

    return collection
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Collection',
    entityId: number,
    metadata: {
      totalAmount: totalAmount.toFixed(2),
      applicationCount: validatedApplications.length,
    },
  })

  revalidatePath('/facturacion/cobros')
  revalidatePath('/facturacion/facturas')
  return { success: true }
}

export async function deleteCollection(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { applications: true },
  })

  if (!collection) throw new Error('Cobro no encontrado')

  // Reverse all applications
  await prisma.$transaction(async (tx) => {
    for (const app of collection.applications) {
      const invoice = await tx.clientInvoice.findUnique({
        where: { id: app.invoiceId },
      })
      if (!invoice) continue

      const currentBalance = new Decimal(invoice.balanceDue.toString())
      const restoredBalance = currentBalance.plus(new Decimal(app.amount.toString()))
      const totalAmount = new Decimal(invoice.totalAmount.toString())

      let newStatus = invoice.status
      if (restoredBalance.gte(totalAmount)) {
        newStatus = 'ISSUED'
      } else if (restoredBalance.gt(0)) {
        newStatus = 'PARTIALLY_PAID'
      }

      await tx.clientInvoice.update({
        where: { id: app.invoiceId },
        data: {
          balanceDue: restoredBalance.toFixed(2),
          status: newStatus,
        },
      })
    }

    await tx.collection.delete({ where: { id } })
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Collection',
    entityId: id,
    metadata: { number: collection.number },
  })

  revalidatePath('/facturacion/cobros')
  revalidatePath('/facturacion/facturas')
  return { success: true }
}
