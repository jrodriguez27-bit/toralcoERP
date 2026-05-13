import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { JournalEntriesTable } from './entries-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AsientosPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const statusFilter = searchParams.status as string | undefined

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter as any } : {}),
  }

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        period: true,
        _count: { select: { lines: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.journalEntry.count({ where }),
  ])

  const serializedEntries = entries.map((e) => ({
    id: e.id,
    number: e.number,
    date: e.date.toISOString(),
    description: e.description,
    type: e.type,
    totalDebit: serializeDecimal(e.totalDebit),
    totalCredit: serializeDecimal(e.totalCredit),
    status: e.status,
    periodName: e.period.name,
    lineCount: e._count.lines,
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asientos Contables"
        description="Gestión de asientos contables"
        createHref="/contabilidad/asientos/nuevo"
        createLabel="Nuevo Asiento"
      />
      <JournalEntriesTable
        data={serializedEntries}
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
