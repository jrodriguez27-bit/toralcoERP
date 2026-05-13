import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { parseSearchParams, formatCurrency, formatDate } from '@/lib/utils'
import { AdjustmentsTable } from './adjustments-table'

export default async function AjustesInventarioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, skip, sortBy, sortDir } = parseSearchParams(searchParams)

  const where = {
    type: { in: ['ADJUSTMENT_IN' as const, 'ADJUSTMENT_OUT' as const] },
    ...(search
      ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' as const } } },
            { product: { code: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [movements, totalCount] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
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
    notes: m.notes,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes de Inventario"
        description="Ajustes de entrada y salida de inventario"
        createHref="/inventario/ajustes/nuevo"
        createLabel="Nuevo Ajuste"
      />
      <AdjustmentsTable
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
