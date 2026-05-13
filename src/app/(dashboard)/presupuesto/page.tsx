import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { BudgetsTable } from './budgets-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PresupuestosPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [budgets, totalCount] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { project: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.budget.count({ where }),
  ])

  const serializedBudgets = budgets.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    status: b.status,
    totalAmount: serializeDecimal(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    project: {
      id: b.project.id,
      name: b.project.name,
    },
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presupuestos"
        description="Gestion de presupuestos por proyecto"
        createHref="/presupuesto/nuevo"
        createLabel="Nuevo Presupuesto"
      />
      <BudgetsTable
        data={serializedBudgets}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir as 'asc' | 'desc'}
      />
    </div>
  )
}
