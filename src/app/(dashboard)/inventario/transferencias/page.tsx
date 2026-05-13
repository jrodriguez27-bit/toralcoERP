import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { parseSearchParams } from '@/lib/utils'
import { TransfersTable } from './transfers-table'

export default async function TransferenciasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, skip, sortBy, sortDir } = parseSearchParams(searchParams)

  const where = search
    ? {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { fromWarehouse: { name: { contains: search, mode: 'insensitive' as const } } },
          { toWarehouse: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {}

  const [transfers, totalCount] = await Promise.all([
    prisma.transfer.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: true,
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.transfer.count({ where }),
  ])

  const data = transfers.map((t) => ({
    id: t.id,
    number: t.number,
    createdAt: t.createdAt.toISOString(),
    fromWarehouseName: t.fromWarehouse.name,
    toWarehouseName: t.toWarehouse.name,
    status: t.status,
    lineCount: t.lines.length,
    notes: t.notes,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferencias"
        description="Transferencias entre almacenes"
        createHref="/inventario/transferencias/nuevo"
        createLabel="Nueva Transferencia"
      />
      <TransfersTable
        data={data}
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
