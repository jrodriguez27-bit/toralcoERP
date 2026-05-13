import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { WarehousesTable } from './warehouses-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function WarehousesPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [warehouses, totalCount] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.warehouse.count({ where }),
  ])

  const serializedWarehouses = warehouses.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    deletedAt: w.deletedAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Almacenes"
        description="Gestión de almacenes"
        createHref="/catalogos/almacenes/nuevo"
        createLabel="Nuevo Almacén"
      />
      <WarehousesTable
        data={serializedWarehouses}
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
