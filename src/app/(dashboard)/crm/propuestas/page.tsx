import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { ProposalsTable } from './proposals-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PropuestasPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
            { lead: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [proposals, totalCount] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.proposal.count({ where }),
  ])

  const serialized = proposals.map((p) => ({
    id: p.id,
    number: p.number,
    title: p.title,
    status: p.status,
    totalAmount: serializeDecimal(p.totalAmount),
    validUntil: p.validUntil ? p.validUntil.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    lead: {
      id: p.lead.id,
      name: p.lead.name,
    },
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propuestas"
        description="Gestion de propuestas comerciales"
        createHref="/crm/propuestas/nuevo"
        createLabel="Nueva Propuesta"
      />
      <ProposalsTable
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
