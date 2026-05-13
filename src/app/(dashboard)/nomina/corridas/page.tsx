import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { RunsTable } from './runs-table'

export default async function CorridasNominaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = search
    ? {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [runs, totalCount] = await Promise.all([
    prisma.payrollRun.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.payrollRun.count({ where }),
  ])

  const serialized = runs.map((r) => ({
    id: r.id,
    number: r.number,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    type: r.type,
    status: r.status,
    totalGross: r.totalGross.toString(),
    totalDeductions: r.totalDeductions.toString(),
    totalNet: r.totalNet.toString(),
    totalEmployerCost: r.totalEmployerCost.toString(),
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corridas de Nómina"
        description="Gestión de corridas de nómina"
        createHref="/nomina/corridas/nuevo"
        createLabel="Nueva Corrida"
      />
      <RunsTable
        data={serialized}
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
