import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

export interface BudgetCheckResult {
  available: boolean
  budgetedAmount: string
  committedAmount: string
  executedAmount: string
  availableAmount: string
  requestedAmount: string
  status: 'green' | 'yellow' | 'red'
}

export async function checkBudgetAvailability(
  projectId: string,
  costCodeId: string,
  requestedAmount: string | number
): Promise<BudgetCheckResult> {
  const budget = await prisma.budget.findFirst({
    where: { projectId, status: 'APPROVED' },
    include: {
      lines: { where: { costCodeId } },
    },
  })

  if (!budget || budget.lines.length === 0) {
    return {
      available: false,
      budgetedAmount: '0',
      committedAmount: '0',
      executedAmount: '0',
      availableAmount: '0',
      requestedAmount: String(requestedAmount),
      status: 'red',
    }
  }

  const line = budget.lines[0]
  const available = new Decimal(line.availableAmount.toString())
  const requested = new Decimal(String(requestedAmount))

  let status: 'green' | 'yellow' | 'red' = 'green'
  if (requested.gt(available)) {
    status = 'red'
  } else if (requested.gt(available.mul(0.8))) {
    status = 'yellow'
  }

  return {
    available: requested.lte(available),
    budgetedAmount: line.budgetedAmount.toString(),
    committedAmount: line.committedAmount.toString(),
    executedAmount: line.executedAmount.toString(),
    availableAmount: line.availableAmount.toString(),
    requestedAmount: String(requestedAmount),
    status,
  }
}

export async function commitBudgetAmount(
  projectId: string,
  costCodeId: string,
  amount: string | number
): Promise<void> {
  const budget = await prisma.budget.findFirst({
    where: { projectId, status: 'APPROVED' },
    include: { lines: { where: { costCodeId } } },
  })

  if (!budget || budget.lines.length === 0) {
    throw new Error('No approved budget found for this project/cost code')
  }

  const line = budget.lines[0]
  const commitAmount = new Decimal(String(amount))
  const newCommitted = new Decimal(line.committedAmount.toString()).plus(commitAmount)
  const newAvailable = new Decimal(line.budgetedAmount.toString())
    .minus(newCommitted)
    .minus(new Decimal(line.executedAmount.toString()))

  await prisma.budgetLine.update({
    where: { id: line.id },
    data: {
      committedAmount: newCommitted.toFixed(2),
      availableAmount: newAvailable.toFixed(2),
    },
  })
}

export async function executeCommittedAmount(
  projectId: string,
  costCodeId: string,
  amount: string | number
): Promise<void> {
  const budget = await prisma.budget.findFirst({
    where: { projectId, status: 'APPROVED' },
    include: { lines: { where: { costCodeId } } },
  })

  if (!budget || budget.lines.length === 0) {
    throw new Error('No approved budget found for this project/cost code')
  }

  const line = budget.lines[0]
  const execAmount = new Decimal(String(amount))
  const newCommitted = Decimal.max(
    new Decimal(0),
    new Decimal(line.committedAmount.toString()).minus(execAmount)
  )
  const newExecuted = new Decimal(line.executedAmount.toString()).plus(execAmount)
  const newAvailable = new Decimal(line.budgetedAmount.toString())
    .minus(newCommitted)
    .minus(newExecuted)

  await prisma.budgetLine.update({
    where: { id: line.id },
    data: {
      committedAmount: newCommitted.toFixed(2),
      executedAmount: newExecuted.toFixed(2),
      availableAmount: newAvailable.toFixed(2),
    },
  })
}
