import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { CostCodesTable } from './cost-codes-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CostCodesPage({ searchParams }: Props) {
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

  const [costCodes, totalCount] = await Promise.all([
    prisma.costCode.findMany({
      where,
      include: { account: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.costCode.count({ where }),
  ])

  const serializedCostCodes = costCodes.map((cc) => ({
    ...cc,
    createdAt: cc.createdAt.toISOString(),
    updatedAt: cc.updatedAt.toISOString(),
    deletedAt: cc.deletedAt?.toISOString() || null,
    account: cc.account
      ? {
          id: cc.account.id,
          code: cc.account.code,
          name: cc.account.name,
        }
      : null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Códigos de Costo"
        description="Gestión de códigos de costo"
        createHref="/catalogos/codigos-costo/nuevo"
        createLabel="Nuevo Código de Costo"
      />
      <CostCodesTable
        data={serializedCostCodes}
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
