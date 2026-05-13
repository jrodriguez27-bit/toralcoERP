'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

export async function getTrialBalance(year: number, month: number) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const accounts = await prisma.accountCatalog.findMany({
    where: { isActive: true, acceptsEntries: true },
    select: { id: true, code: true, name: true, type: true, nature: true },
    orderBy: { code: 'asc' },
  })

  const aggregates = await prisma.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      entry: {
        status: 'POSTED',
        date: { gte: startDate, lte: endDate },
      },
    },
    _sum: { debit: true, credit: true },
  })

  const aggregateMap = new Map(
    aggregates.map((a) => [
      a.accountId,
      {
        debit: a._sum.debit?.toString() || '0',
        credit: a._sum.credit?.toString() || '0',
      },
    ])
  )

  const rows = accounts.map((account) => {
    const agg = aggregateMap.get(account.id)
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      debit: agg?.debit || '0',
      credit: agg?.credit || '0',
    }
  })

  return rows
}

export async function getAvailablePeriods() {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const periods = await prisma.accountingPeriod.findMany({
    select: { id: true, year: true, month: true, isClosed: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  return periods.map((p) => ({
    value: `${p.year}-${p.month}`,
    label: `${p.year} - ${String(p.month).padStart(2, '0')}`,
    year: p.year,
    month: p.month,
    isClosed: p.isClosed,
  }))
}
