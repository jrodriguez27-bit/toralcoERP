import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { MaintenanceTable } from './maintenance-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function MantenimientoPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' as const } },
            { vendor: { contains: search, mode: 'insensitive' as const } },
            { asset: { name: { contains: search, mode: 'insensitive' as const } } },
            { asset: { code: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [maintenances, totalCount] = await Promise.all([
    prisma.assetMaintenance.findMany({
      where,
      include: {
        asset: { select: { id: true, code: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.assetMaintenance.count({ where }),
  ])

  const serialized = maintenances.map((m) => ({
    id: m.id,
    type: m.type,
    description: m.description,
    scheduledDate: m.scheduledDate?.toISOString() || null,
    completedDate: m.completedDate?.toISOString() || null,
    cost: m.cost.toString(),
    vendor: m.vendor,
    status: m.status,
    asset: { id: m.asset.id, code: m.asset.code, name: m.asset.name },
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mantenimiento de Activos"
        description="Gestion de mantenimiento preventivo y correctivo"
        createHref="/activos-fijos/mantenimiento/nuevo"
        createLabel="Nuevo Mantenimiento"
      />
      <MaintenanceTable
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
