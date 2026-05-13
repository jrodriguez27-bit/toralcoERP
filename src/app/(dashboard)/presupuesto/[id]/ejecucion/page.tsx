import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { ExecutionView } from './execution-view'

export default async function BudgetExecutionPage({ params }: { params: { id: string } }) {
  const budget = await prisma.budget.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      lines: {
        include: {
          costCode: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!budget) notFound()

  const serializedBudget = {
    id: budget.id,
    code: budget.code,
    name: budget.name,
    status: budget.status,
    totalAmount: serializeDecimal(budget.totalAmount),
    projectName: budget.project.name,
    lines: budget.lines.map((line) => ({
      id: line.id,
      costCodeName: `${line.costCode.code} - ${line.costCode.name}`,
      costCodeShort: line.costCode.code,
      budgetedAmount: serializeDecimal(line.budgetedAmount),
      committedAmount: serializeDecimal(line.committedAmount),
      executedAmount: serializeDecimal(line.executedAmount),
      availableAmount: serializeDecimal(line.availableAmount),
    })),
  }

  return <ExecutionView budget={serializedBudget} />
}
