import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { SuppliersTable } from './suppliers-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function SuppliersPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { rnc: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [suppliers, totalCount] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ])

  const serializedSuppliers = suppliers.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    deletedAt: s.deletedAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Gestión de proveedores"
        createHref="/catalogos/proveedores/nuevo"
        createLabel="Nuevo Proveedor"
      />
      <SuppliersTable
        data={serializedSuppliers}
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
