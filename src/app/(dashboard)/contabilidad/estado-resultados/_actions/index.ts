'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

interface IncomeStatementAccount {
  id: string
  code: string
  name: string
  type: string
  balance: string
}

interface IncomeStatementData {
  income: IncomeStatementAccount[]
  costs: IncomeStatementAccount[]
  expenses: IncomeStatementAccount[]
  totalIncome: string
  totalCosts: string
  totalExpenses: string
  netResult: string
}

export async function getIncomeStatement(
  startDate: string,
  endDate: string
): Promise<IncomeStatementData> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const accounts = await prisma.accountCatalog.findMany({
    where: {
      isActive: true,
      acceptsEntries: true,
      type: { in: ['INCOME', 'COST', 'EXPENSE'] },
    },
    select: { id: true, code: true, name: true, type: true },
    orderBy: { code: 'asc' },
  })

  const aggregates = await prisma.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      entry: { status: 'POSTED', date: { gte: start, lte: end } },
    },
    _sum: { debit: true, credit: true },
  })

  const aggMap = new Map(
    aggregates.map((a) => [a.accountId, {
      debit: new Decimal(a._sum.debit?.toString() || '0'),
      credit: new Decimal(a._sum.credit?.toString() || '0'),
    }])
  )

  const mapAccount = (account: typeof accounts[number]): IncomeStatementAccount => {
    const agg = aggMap.get(account.id)
    const debit = agg?.debit || new Decimal(0)
    const credit = agg?.credit || new Decimal(0)
    // INCOME: credit - debit. COST/EXPENSE: debit - credit
    const balance = account.type === 'INCOME'
      ? credit.minus(debit)
      : debit.minus(credit)
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      balance: balance.toFixed(2),
    }
  }

  const income = accounts.filter((a) => a.type === 'INCOME').map(mapAccount)
  const costs = accounts.filter((a) => a.type === 'COST').map(mapAccount)
  const expenses = accounts.filter((a) => a.type === 'EXPENSE').map(mapAccount)

  const sum = (items: IncomeStatementAccount[]) =>
    items.reduce((s, i) => s.plus(i.balance), new Decimal(0))

  const totalIncome = sum(income)
  const totalCosts = sum(costs)
  const totalExpenses = sum(expenses)
  const netResult = totalIncome.minus(totalCosts).minus(totalExpenses)

  return {
    income,
    costs,
    expenses,
    totalIncome: totalIncome.toFixed(2),
    totalCosts: totalCosts.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netResult: netResult.toFixed(2),
  }
}
