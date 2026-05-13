import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { ClientsTable } from './clients-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ClientsPage({ searchParams }: Props) {
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

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ])

  const serializedClients = clients.map((c) => ({
    ...c,
    creditLimit: c.creditLimit?.toString() || null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestión de clientes"
        createHref="/catalogos/clientes/nuevo"
        createLabel="Nuevo Cliente"
      />
      <ClientsTable
        data={serializedClients}
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
