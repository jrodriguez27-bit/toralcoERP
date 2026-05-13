'use server'

import { prisma } from '@/lib/prisma'
import { paymentSchema } from '@/lib/validations/compras'
import { logAudit } from '@/lib/services/audit.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

interface PaymentApplicationInput {
  invoiceId: string
  amount: string
}

export async function createPayment(data: {
  paymentDate: string
  paymentMethod: 'CASH' | 'CHECK' | 'TRANSFER' | 'CREDIT_CARD'
  bankAccount?: string | null
  reference?: string | null
  notes?: string | null
  applications: PaymentApplicationInput[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate header
  const headerData = paymentSchema.parse({
    paymentDate: data.paymentDate,
    paymentMethod: data.paymentMethod,
    bankAccount: data.bankAccount || null,
    reference: data.reference || null,
    notes: data.notes || null,
  })

  if (!data.applications || data.applications.length === 0) {
    throw new Error('Debe seleccionar al menos una factura para pagar')
  }

  // Validate applications and compute total
  let totalAmount = new Decimal(0)
  const validatedApplications: { invoiceId: string; amount: Decimal }[] = []

  for (const app of data.applications) {
    const amount = new Decimal(app.amount)
    if (amount.lte(0)) {
      throw new Error('El monto de cada aplicacion debe ser mayor a cero')
    }

    // Verify invoice exists and has enough balance
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: app.invoiceId },
    })

    if (!invoice) {
      throw new Error(`Factura ${app.invoiceId} no encontrada`)
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new Error(`La factura ${invoice.number} no tiene saldo pendiente`)
    }

    const balanceDue = new Decimal(invoice.balanceDue.toString())
    if (amount.gt(balanceDue)) {
      throw new Error(
        `El monto (${amount.toFixed(2)}) excede el saldo pendiente (${balanceDue.toFixed(2)}) de la factura ${invoice.number}`
      )
    }

    totalAmount = totalAmount.plus(amount)
    validatedApplications.push({ invoiceId: app.invoiceId, amount })
  }

  const number = await generateSequentialNumber(prisma, 'PAYMENT', 'PAG')

  // Find accounts for journal entry
  const apAccount = await prisma.accountCatalog.findFirst({
    where: {
      type: 'LIABILITY',
      code: { startsWith: '2.1' },
      acceptsEntries: true,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { code: 'asc' },
  })

  // Use a bank/cash asset account
  const cashAccount = await prisma.accountCatalog.findFirst({
    where: {
      type: 'ASSET',
      code: { startsWith: '1.1' },
      acceptsEntries: true,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { code: 'asc' },
  })

  if (!apAccount) throw new Error('No se encontro una cuenta de cuentas por pagar')
  if (!cashAccount) throw new Error('No se encontro una cuenta de banco/caja')

  // Create journal entry: Debit AP, Credit Bank/Cash
  const journalEntryId = await createJournalEntry({
    date: new Date(headerData.paymentDate),
    description: `Pago a proveedores ${number}`,
    type: 'AUTOMATIC',
    referenceType: 'PAYMENT',
    lines: [
      {
        accountId: apAccount.id,
        description: `Pago CxP ${number}`,
        debit: totalAmount.toFixed(2),
        credit: '0',
      },
      {
        accountId: cashAccount.id,
        description: `Desembolso ${number}`,
        debit: '0',
        credit: totalAmount.toFixed(2),
      },
    ],
  })

  // Create payment with applications
  const payment = await prisma.payment.create({
    data: {
      number,
      paymentDate: new Date(headerData.paymentDate),
      paymentMethod: headerData.paymentMethod,
      bankAccount: headerData.bankAccount || null,
      reference: headerData.reference || null,
      totalAmount: totalAmount.toFixed(2),
      notes: headerData.notes || null,
      journalEntryId,
      applications: {
        create: validatedApplications.map((app) => ({
          invoiceId: app.invoiceId,
          amount: app.amount.toFixed(2),
        })),
      },
    },
  })

  // Update journal entry with referenceId
  await prisma.journalEntry.update({
    where: { id: journalEntryId },
    data: { referenceId: payment.id },
  })

  // Update invoice balances and statuses
  for (const app of validatedApplications) {
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: app.invoiceId },
    })

    if (invoice) {
      const currentBalance = new Decimal(invoice.balanceDue.toString())
      const newBalance = currentBalance.minus(app.amount)
      const newStatus = newBalance.lte(0) ? 'PAID' : 'PARTIALLY_PAID'

      await prisma.supplierInvoice.update({
        where: { id: app.invoiceId },
        data: {
          balanceDue: Decimal.max(new Decimal(0), newBalance).toFixed(2),
          status: newStatus,
        },
      })
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Payment',
    entityId: payment.id,
    metadata: { number, totalAmount: totalAmount.toFixed(2) },
  })

  revalidatePath('/compras/pagos')
  revalidatePath('/compras/facturas-proveedor')
  revalidatePath('/compras/cuentas-por-pagar')
  return { success: true, id: payment.id }
}

export async function deletePayment(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      applications: {
        include: { invoice: true },
      },
    },
  })

  if (!payment) throw new Error('Pago no encontrado')

  // Reverse applications - restore invoice balances
  for (const app of payment.applications) {
    const invoice = app.invoice
    const currentBalance = new Decimal(invoice.balanceDue.toString())
    const restoredBalance = currentBalance.plus(new Decimal(app.amount.toString()))
    const totalAmount = new Decimal(invoice.totalAmount.toString())

    let newStatus: 'PENDING' | 'PARTIALLY_PAID' = 'PARTIALLY_PAID'
    if (restoredBalance.gte(totalAmount)) {
      newStatus = 'PENDING'
    }

    await prisma.supplierInvoice.update({
      where: { id: app.invoiceId },
      data: {
        balanceDue: restoredBalance.toFixed(2),
        status: newStatus,
      },
    })
  }

  // Delete the payment (cascades to applications)
  await prisma.payment.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Payment',
    entityId: id,
  })

  revalidatePath('/compras/pagos')
  revalidatePath('/compras/facturas-proveedor')
  revalidatePath('/compras/cuentas-por-pagar')
  return { success: true }
}
