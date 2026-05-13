import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { RequisitionsTable } from './requisitions-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function RequisicionesPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { project: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [requisitions, totalCount] = await Promise.all([
    prisma.requisition.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.requisition.count({ where }),
  ])

  const serialized = requisitions.map((r) => ({
    id: r.id,
    number: r.number,
    description: r.description,
    status: r.status,
    requestedBy: r.requestedBy,
    createdAt: r.createdAt.toISOString(),
    project: {
      id: r.project.id,
      name: r.project.name,
    },
    lineCount: r._count.lines,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisiciones"
        description="Gestion de requisiciones de compra"
        createHref="/compras/requisiciones/nuevo"
        createLabel="Nueva Requisicion"
      />
      <RequisitionsTable
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
