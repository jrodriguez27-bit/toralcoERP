'use server'

import { prisma } from '@/lib/prisma'
import { journalEntrySchema, journalEntryLineSchema } from '@/lib/validations/contabilidad'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import { postJournalEntry } from '@/lib/services/accounting.service'
import Decimal from 'decimal.js'
import { z } from 'zod'

const createJournalEntryInput = journalEntrySchema.extend({
  lines: z.array(journalEntryLineSchema).min(2, 'Se requieren al menos 2 líneas'),
})

export async function createJournalEntryAction(data: {
  date: string
  description: string
  reference?: string | null
  notes?: string | null
  lines: { accountId: string; description?: string | null; debit: string; credit: string }[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = createJournalEntryInput.parse(data)

  // Validate debit = credit balance
  let totalDebit = new Decimal(0)
  let totalCredit = new Decimal(0)
  for (const line of validated.lines) {
    totalDebit = totalDebit.plus(new Decimal(line.debit || '0'))
    totalCredit = totalCredit.plus(new Decimal(line.credit || '0'))
  }

  if (!totalDebit.eq(totalCredit)) {
    throw new Error(`Asiento desbalanceado: Débito ${totalDebit.toFixed(2)} != Crédito ${totalCredit.toFixed(2)}`)
  }

  if (totalDebit.eq(0)) {
    throw new Error('El asiento debe tener un monto mayor a cero')
  }

  // Find or create period
  const entryDate = new Date(validated.date)
  const year = entryDate.getFullYear()
  const month = entryDate.getMonth() + 1

  let period = await prisma.accountingPeriod.findUnique({
    where: { year_month: { year, month } },
  })

  if (!period) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    period = await prisma.accountingPeriod.create({
      data: {
        name: `${entryDate.toLocaleString('es-DO', { month: 'long' })} ${year}`,
        startDate,
        endDate,
        year,
        month,
      },
    })
  }

  if (period.isClosed) {
    throw new Error('El período contable está cerrado')
  }

  // Generate sequential number
  const number = await generateSequentialNumber(prisma, 'JOURNAL_ENTRY', 'AST')

  const entry = await prisma.journalEntry.create({
    data: {
      number,
      periodId: period.id,
      date: entryDate,
      description: validated.description,
      type: 'MANUAL',
      reference: validated.reference || null,
      notes: validated.notes || null,
      status: 'DRAFT',
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      lines: {
        create: validated.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || null,
          debit: new Decimal(l.debit || '0').toFixed(2),
          credit: new Decimal(l.credit || '0').toFixed(2),
        })),
      },
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'JournalEntry',
    entityId: entry.id,
  })

  revalidatePath('/contabilidad/asientos')
  return { success: true, id: entry.id }
}

export async function postJournalEntryAction(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await postJournalEntry(id)

  await prisma.journalEntry.update({
    where: { id },
    data: {
      postedBy: session.user.id,
      postedAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'POST',
    entity: 'JournalEntry',
    entityId: id,
  })

  revalidatePath('/contabilidad/asientos')
  return { success: true }
}

export async function reverseJournalEntry(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const original = await prisma.journalEntry.findUnique({
    where: { id },
    include: { lines: true, period: true },
  })

  if (!original) throw new Error('Asiento no encontrado')
  if (original.status !== 'POSTED') throw new Error('Solo se pueden reversar asientos contabilizados')
  if (original.period.isClosed) throw new Error('El período contable está cerrado')

  // Generate new number for the reversing entry
  const number = await generateSequentialNumber(prisma, 'JOURNAL_ENTRY', 'AST')

  // Create reversing entry with swapped debits/credits
  const reversingEntry = await prisma.journalEntry.create({
    data: {
      number,
      periodId: original.periodId,
      date: new Date(),
      description: `Reversión de ${original.number}: ${original.description}`,
      type: 'MANUAL',
      reference: original.number,
      referenceType: 'JOURNAL_REVERSAL',
      referenceId: original.id,
      status: 'POSTED',
      totalDebit: original.totalCredit.toString(),
      totalCredit: original.totalDebit.toString(),
      postedBy: session.user.id,
      postedAt: new Date(),
      lines: {
        create: original.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description ? `Rev: ${l.description}` : `Reversión`,
          debit: l.credit.toString(),
          credit: l.debit.toString(),
        })),
      },
    },
  })

  // Mark original as reversed
  await prisma.journalEntry.update({
    where: { id },
    data: { status: 'REVERSED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'REVERSE',
    entity: 'JournalEntry',
    entityId: id,
    metadata: { reversingEntryId: reversingEntry.id },
  })

  revalidatePath('/contabilidad/asientos')
  return { success: true, reversingEntryId: reversingEntry.id }
}

export async function deleteJournalEntry(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
  })

  if (!entry) throw new Error('Asiento no encontrado')
  if (entry.status !== 'DRAFT') throw new Error('Solo se pueden eliminar asientos en borrador')

  await prisma.journalEntry.delete({
    where: { id },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'JournalEntry',
    entityId: id,
  })

  revalidatePath('/contabilidad/asientos')
  return { success: true }
}
