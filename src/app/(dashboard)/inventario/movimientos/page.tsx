import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { parseSearchParams } from '@/lib/utils'
import { MovementsTable } from './movements-table'

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, skip, sortBy, sortDir } = parseSearchParams(searchParams)

  const where = search
    ? {
        OR: [
          { product: { name: { contains: search, mode: 'insensitive' as const } } },
          { product: { code: { contains: search, mode: 'insensitive' as const } } },
          { reference: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [movements, totalCount] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        project: true,
        costCode: true,
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ])

  const data = movements.map((m) => ({
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    productName: m.product.name,
    productCode: m.product.code,
    warehouseName: m.warehouse.name,
    type: m.type,
    quantity: m.quantity.toString(),
    unitCost: m.unitCost.toString(),
    totalCost: m.totalCost.toString(),
    reference: m.reference,
    referenceType: m.referenceType,
    projectName: m.project?.name || null,
    costCodeName: m.costCode ? `${m.costCode.code} - ${m.costCode.name}` : null,
    notes: m.notes,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos de Inventario"
        description="Historial de entradas, salidas y ajustes de inventario"
      />
      <MovementsTable
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
