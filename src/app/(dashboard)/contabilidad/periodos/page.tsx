import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { PeriodsTable } from './periods-table'

export default async function PeriodosPage() {
  const periods = await prisma.accountingPeriod.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      _count: { select: { journalEntries: true } },
    },
  })

  // Check if current month period exists
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentPeriodExists = periods.some(
    (p) => p.year === currentYear && p.month === currentMonth
  )

  const serializedPeriods = periods.map((p) => ({
    id: p.id,
    name: p.name,
    year: p.year,
    month: p.month,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    isClosed: p.isClosed,
    closedAt: p.closedAt?.toISOString() || null,
    entryCount: p._count.journalEntries,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Periodos Contables"
        description="Gestion de periodos contables"
      />
      <PeriodsTable
        data={serializedPeriods}
        currentPeriodExists={currentPeriodExists}
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </div>
  )
}
