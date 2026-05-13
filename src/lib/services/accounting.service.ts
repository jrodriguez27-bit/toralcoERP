import { prisma } from '@/lib/prisma'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

interface JournalLine {
  accountId: string
  description?: string
  debit: string
  credit: string
}

export async function createJournalEntry(params: {
  date: Date
  description: string
  type?: 'MANUAL' | 'AUTOMATIC'
  referenceType?: string
  referenceId?: string
  reference?: string
  lines: JournalLine[]
}): Promise<string> {
  const { date, description, type = 'AUTOMATIC', referenceType, referenceId, reference, lines } = params

  // Validate debit = credit
  let totalDebit = new Decimal(0)
  let totalCredit = new Decimal(0)
  for (const line of lines) {
    totalDebit = totalDebit.plus(new Decimal(line.debit || '0'))
    totalCredit = totalCredit.plus(new Decimal(line.credit || '0'))
  }

  if (!totalDebit.eq(totalCredit)) {
    throw new Error(`Asiento desbalanceado: Débito ${totalDebit.toFixed(2)} != Crédito ${totalCredit.toFixed(2)}`)
  }

  // Find or create period
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  let period = await prisma.accountingPeriod.findUnique({
    where: { year_month: { year, month } },
  })

  if (!period) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    period = await prisma.accountingPeriod.create({
      data: {
        name: `${date.toLocaleString('es-DO', { month: 'long' })} ${year}`,
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

  const number = await generateSequentialNumber(prisma, 'JOURNAL_ENTRY', 'AST')

  const entry = await prisma.journalEntry.create({
    data: {
      number,
      periodId: period.id,
      date,
      description,
      type,
      referenceType,
      referenceId,
      reference,
      status: 'POSTED',
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      postedAt: new Date(),
      lines: {
        create: lines.map((l) => ({
          accountId: l.accountId,
          description: l.description,
          debit: new Decimal(l.debit || '0').toFixed(2),
          credit: new Decimal(l.credit || '0').toFixed(2),
        })),
      },
    },
  })

  return entry.id
}

export async function postJournalEntry(entryId: string): Promise<void> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    include: { lines: true, period: true },
  })

  if (!entry) throw new Error('Asiento no encontrado')
  if (entry.status === 'POSTED') throw new Error('Asiento ya contabilizado')
  if (entry.period.isClosed) throw new Error('Período cerrado')

  // Validate balance
  let totalDebit = new Decimal(0)
  let totalCredit = new Decimal(0)
  for (const line of entry.lines) {
    totalDebit = totalDebit.plus(new Decimal(line.debit.toString()))
    totalCredit = totalCredit.plus(new Decimal(line.credit.toString()))
  }

  if (!totalDebit.eq(totalCredit)) {
    throw new Error('Asiento desbalanceado')
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: { status: 'POSTED', postedAt: new Date() },
  })
}

export async function getAccountBalance(
  accountId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ debit: string; credit: string; balance: string }> {
  const where: Record<string, unknown> = {
    accountId,
    entry: { status: 'POSTED' },
  }

  if (startDate || endDate) {
    where.entry = {
      ...where.entry as object,
      date: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      },
    }
  }

  const result = await prisma.journalEntryLine.aggregate({
    where: where as any,
    _sum: { debit: true, credit: true },
  })

  const debit = new Decimal(result._sum.debit?.toString() || '0')
  const credit = new Decimal(result._sum.credit?.toString() || '0')

  return {
    debit: debit.toFixed(2),
    credit: credit.toFixed(2),
    balance: debit.minus(credit).toFixed(2),
  }
}
