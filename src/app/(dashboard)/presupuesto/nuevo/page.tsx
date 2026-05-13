import { prisma } from '@/lib/prisma'
import { BudgetForm } from '../budget-form'

export default async function NewBudgetPage() {
  const [projects, costCodes] = await Promise.all([
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

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const costCodeOptions = costCodes.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
  }))

  return (
    <div className="space-y-6">
      <BudgetForm projects={projectOptions} costCodes={costCodeOptions} />
    </div>
  )
}
