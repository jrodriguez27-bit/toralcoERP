import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { ProductsTable } from './products-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ProductsPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])

  const serializedProducts = products.map((p) => ({
    ...p,
    minStock: p.minStock.toString(),
    maxStock: p.maxStock?.toString() || null,
    lastCost: p.lastCost?.toString() || null,
    averageCost: p.averageCost?.toString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestión de productos y materiales"
        createHref="/catalogos/productos/nuevo"
        createLabel="Nuevo Producto"
      />
      <ProductsTable
        data={serializedProducts}
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
