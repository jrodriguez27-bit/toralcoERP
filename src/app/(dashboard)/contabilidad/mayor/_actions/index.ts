'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getLedgerEntries(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const account = await prisma.accountCatalog.findUnique({
    where: { id: accountId },
    select: { id: true, code: true, name: true, type: true, nature: true },
  })

  if (!account) throw new Error('Cuenta no encontrada')

  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = new Date(startDate)
  if (endDate) dateFilter.lte = new Date(endDate)

  // Get opening balance (all posted entries before startDate)
  let openingDebit = '0'
  let openingCredit = '0'

  if (startDate) {
    const opening = await prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        entry: {
          status: 'POSTED',
          date: { lt: new Date(startDate) },
        },
      },
      _sum: { debit: true, credit: true },
    })
    openingDebit = opening._sum.debit?.toString() || '0'
    openingCredit = opening._sum.credit?.toString() || '0'
  }

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId,
      entry: {
        status: 'POSTED',
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      entry: {
        select: {
          id: true,
          number: true,
          date: true,
          description: true,
        },
      },
    },
    orderBy: { entry: { date: 'asc' } },
  })

  const serializedLines = lines.map((line) => ({
    id: line.id,
    entryId: line.entry.id,
    entryNumber: line.entry.number,
    date: line.entry.date.toISOString(),
    description: line.entry.description,
    debit: line.debit.toString(),
    credit: line.credit.toString(),
  }))

  return {
    account: {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
    },
    openingDebit,
    openingCredit,
    lines: serializedLines,
  }
}

export async function getAccountOptions() {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const accounts = await prisma.accountCatalog.findMany({
    where: { isActive: true, acceptsEntries: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  return accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))
}
