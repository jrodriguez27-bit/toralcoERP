import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { OrdersTable } from './orders-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function OrdenesCompraPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { supplier: { name: { contains: search, mode: 'insensitive' as const } } },
            { project: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [orders, totalCount] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
  ])

  const serialized = orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    totalAmount: serializeDecimal(o.totalAmount),
    createdAt: o.createdAt.toISOString(),
    supplier: {
      id: o.supplier.id,
      name: o.supplier.name,
    },
    project: {
      id: o.project.id,
      name: o.project.name,
    },
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordenes de Compra"
        description="Gestion de ordenes de compra"
        createHref="/compras/ordenes-compra/nuevo"
        createLabel="Nueva Orden de Compra"
      />
      <OrdersTable
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
