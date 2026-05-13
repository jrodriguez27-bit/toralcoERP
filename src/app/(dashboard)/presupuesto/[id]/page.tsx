import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { BudgetForm } from '../budget-form'

export default async function EditBudgetPage({ params }: { params: { id: string } }) {
  const [budget, projects, costCodes] = await Promise.all([
    prisma.budget.findUnique({
      where: { id: params.id },
      include: {
        lines: {
          include: {
            costCode: true,
            account: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.costCode.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  if (!budget) notFound()

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const costCodeOptions = costCodes.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
  }))

  const serializedBudget = {
    id: budget.id,
    code: budget.code,
    name: budget.name,
    projectId: budget.projectId,
    status: budget.status,
    totalAmount: serializeDecimal(budget.totalAmount),
    notes: budget.notes,
    approvedBy: budget.approvedBy,
    lines: budget.lines.map((line) => ({
      id: line.id,
      costCodeId: line.costCodeId,
      costCodeName: `${line.costCode.code} - ${line.costCode.name}`,
      accountId: line.accountId,
      description: line.description,
      quantity: serializeDecimal(line.quantity),
      unitCost: serializeDecimal(line.unitCost),
      budgetedAmount: serializeDecimal(line.budgetedAmount),
      committedAmount: serializeDecimal(line.committedAmount),
      executedAmount: serializeDecimal(line.executedAmount),
      availableAmount: serializeDecimal(line.availableAmount),
    })),
  }

  return (
    <div className="space-y-6">
      <BudgetForm
        budget={serializedBudget}
        projects={projectOptions}
        costCodes={costCodeOptions}
      />
    </div>
  )
}
