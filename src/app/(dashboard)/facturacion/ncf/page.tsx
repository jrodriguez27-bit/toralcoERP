import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { NcfTable } from './ncf-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function NcfPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { type: { contains: search, mode: 'insensitive' as const } },
            { prefix: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [sequences, totalCount] = await Promise.all([
    prisma.ncfSequence.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.ncfSequence.count({ where }),
  ])

  const serialized = sequences.map((s) => ({
    id: s.id,
    type: s.type,
    prefix: s.prefix,
    currentNumber: s.currentNumber,
    rangeFrom: s.rangeFrom,
    rangeTo: s.rangeTo,
    remaining: s.rangeTo - s.currentNumber,
    expirationDate: s.expirationDate ? s.expirationDate.toISOString() : null,
    isActive: s.isActive,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Secuencias NCF"
        description="Gestion de secuencias de comprobantes fiscales"
        createHref="/facturacion/ncf/nuevo"
        createLabel="Nueva Secuencia"
      />
      <NcfTable
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
