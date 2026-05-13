import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { LeadsTable } from './leads-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LeadsPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
            { contactName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [leads, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ])

  const serialized = leads.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    contactName: l.contactName,
    email: l.email,
    phone: l.phone,
    source: l.source,
    stage: l.stage,
    estimatedValue: l.estimatedValue ? serializeDecimal(l.estimatedValue) : null,
    probability: l.probability,
    nextFollowUp: l.nextFollowUp ? l.nextFollowUp.toISOString() : null,
    clientId: l.clientId,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gestion de leads y oportunidades comerciales"
        createHref="/crm/leads/nuevo"
        createLabel="Nuevo Lead"
      />
      <LeadsTable
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
