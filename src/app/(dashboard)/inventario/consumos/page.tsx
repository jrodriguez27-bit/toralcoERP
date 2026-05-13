import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Column } from '@/components/shared/data-table'
import { parseSearchParams, formatCurrency, formatDate } from '@/lib/utils'
import { ConsumptionsTable } from './consumptions-table'

export default async function ConsumosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, skip, sortBy, sortDir } = parseSearchParams(searchParams)

  const where = {
    referenceType: 'CONSUMPTION',
    type: 'EXIT' as const,
    ...(search
      ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' as const } } },
            { product: { code: { contains: search, mode: 'insensitive' as const } } },
            { project: { name: { contains: search, mode: 'insensitive' as const } } },
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
    quantity: m.quantity.toString(),
    unitCost: m.unitCost.toString(),
    totalCost: m.totalCost.toString(),
    projectName: m.project?.name || '-',
    costCodeName: m.costCode ? `${m.costCode.code} - ${m.costCode.name}` : '-',
    notes: m.notes,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consumos Directos"
        description="Salidas de material a proyectos"
        createHref="/inventario/consumos/nuevo"
        createLabel="Nuevo Consumo"
      />
      <ConsumptionsTable
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
