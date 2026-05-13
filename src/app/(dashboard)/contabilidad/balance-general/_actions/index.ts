'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

interface BalanceSheetAccount {
  id: string
  code: string
  name: string
  type: string
  balance: string
}

interface BalanceSheetData {
  assets: BalanceSheetAccount[]
  liabilities: BalanceSheetAccount[]
  equity: BalanceSheetAccount[]
  totalAssets: string
  totalLiabilities: string
  totalEquity: string
}

export async function getBalanceSheet(asOfDate: string): Promise<BalanceSheetData> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const endDate = new Date(asOfDate)
  endDate.setHours(23, 59, 59, 999)

  const accounts = await prisma.accountCatalog.findMany({
    where: {
      isActive: true,
      acceptsEntries: true,
      type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
    },
    select: { id: true, code: true, name: true, type: true, nature: true },
    orderBy: { code: 'asc' },
  })

  const aggregates = await prisma.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      entry: { status: 'POSTED', date: { lte: endDate } },
    },
    _sum: { debit: true, credit: true },
  })

  const aggMap = new Map(
    aggregates.map((a) => [a.accountId, {
      debit: new Decimal(a._sum.debit?.toString() || '0'),
      credit: new Decimal(a._sum.credit?.toString() || '0'),
    }])
  )

  const mapAccount = (account: typeof accounts[number]): BalanceSheetAccount => {
    const agg = aggMap.get(account.id)
    const debit = agg?.debit || new Decimal(0)
    const credit = agg?.credit || new Decimal(0)
    // ASSET: debit - credit. LIABILITY/EQUITY: credit - debit
    const balance = account.type === 'ASSET'
      ? debit.minus(credit)
      : credit.minus(debit)
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      balance: balance.toFixed(2),
    }
  }

  const assets = accounts.filter((a) => a.type === 'ASSET').map(mapAccount)
  const liabilities = accounts.filter((a) => a.type === 'LIABILITY').map(mapAccount)
  const equity = accounts.filter((a) => a.type === 'EQUITY').map(mapAccount)

  const sum = (items: BalanceSheetAccount[]) =>
    items.reduce((s, i) => s.plus(i.balance), new Decimal(0)).toFixed(2)

  return {
    assets,
    liabilities,
    equity,
    totalAssets: sum(assets),
    totalLiabilities: sum(liabilities),
    totalEquity: sum(equity),
  }
}
