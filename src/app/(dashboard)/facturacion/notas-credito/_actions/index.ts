'use server'

import { prisma } from '@/lib/prisma'
import { creditNoteSchema } from '@/lib/validations/facturacion'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import { getNextNcf } from '@/lib/services/invoicing.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import Decimal from 'decimal.js'

export async function createCreditNote(data: {
  invoiceId: string
  amount: string
  reason: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = creditNoteSchema.parse(data)
  const amount = new Decimal(validated.amount)

  // Validate invoice
  const invoice = await prisma.clientInvoice.findUnique({
    where: { id: validated.invoiceId },
    include: { client: true },
  })

  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'ISSUED' && invoice.status !== 'PARTIALLY_PAID') {
    throw new Error('Solo se pueden crear notas de credito para facturas emitidas o parcialmente pagadas')
  }

  const currentBalance = new Decimal(invoice.balanceDue.toString())
  if (amount.gt(currentBalance)) {
    throw new Error(`El monto de la nota de credito (${amount.toFixed(2)}) no puede exceder el balance pendiente (${currentBalance.toFixed(2)})`)
  }

  const number = await generateSequentialNumber(prisma, 'CREDIT_NOTE', 'NC')

  // Optionally assign NCF B04 for credit notes
  let ncf: string | null = null
  try {
    ncf = await getNextNcf('B04')
  } catch {
    // No B04 sequence configured, continue without NCF
  }

  // Create journal entry: debit Revenue, credit AR
  let journalEntryId: string | null = null
  const revenueAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '4.1' }, acceptsEntries: true, isActive: true },
  })
  const arAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '1.1.03' }, acceptsEntries: true, isActive: true },
  })

  if (revenueAccount && arAccount) {
    journalEntryId = await createJournalEntry({
      date: new Date(),
      description: `Nota de Credito ${number} - Factura ${invoice.number}`,
      type: 'AUTOMATIC',
      referenceType: 'CreditNote',
      referenceId: validated.invoiceId,
      reference: number,
      lines: [
        {
          accountId: revenueAccount.id,
          description: `Devolucion/Ajuste - NC ${number}`,
          debit: amount.toFixed(2),
          credit: '0',
        },
        {
          accountId: arAccount.id,
          description: `Reduccion CxC - NC ${number}`,
          debit: '0',
          credit: amount.toFixed(2),
        },
      ],
    })
  }

  // Create credit note and update invoice balance
  const newBalance = currentBalance.minus(amount)
  let newStatus = invoice.status as 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'DRAFT'
  if (newBalance.lte(0)) {
    newStatus = 'PAID'
  } else if (newBalance.lt(new Decimal(invoice.totalAmount.toString()))) {
    newStatus = 'PARTIALLY_PAID'
  }

  await prisma.$transaction([
    prisma.creditNote.create({
      data: {
        number,
        ncf,
        invoiceId: validated.invoiceId,
        amount: amount.toFixed(2),
        reason: validated.reason,
        journalEntryId,
      },
    }),
    prisma.clientInvoice.update({
      where: { id: validated.invoiceId },
      data: {
        balanceDue: newBalance.toFixed(2),
        status: newStatus,
      },
    }),
  ])

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'CreditNote',
    entityId: number,
    metadata: { invoiceId: validated.invoiceId, amount: amount.toFixed(2), ncf },
  })

  revalidatePath('/facturacion/notas-credito')
  revalidatePath('/facturacion/facturas')
  return { success: true }
}
