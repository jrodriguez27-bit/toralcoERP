import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { DepreciationView } from './depreciation-view'

export default async function DepreciacionPage() {
  const runs = await prisma.depreciationRun.findMany({
    orderBy: { period: 'desc' },
    include: {
      _count: { select: { entries: true } },
      entries: {
        include: {
          asset: { select: { code: true, name: true } },
        },
      },
    },
    take: 50,
  })

  const serializedRuns = runs.map((r) => ({
    id: r.id,
    period: r.period,
    runDate: r.runDate.toISOString(),
    totalAmount: r.totalAmount.toString(),
    entryCount: r._count.entries,
    entries: r.entries.map((e) => ({
      id: e.id,
      assetCode: e.asset.code,
      assetName: e.asset.name,
      amount: e.amount.toString(),
    })),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depreciacion"
        description="Corridas de depreciacion de activos fijos"
      />
      <DepreciationView runs={serializedRuns} />
    </div>
  )
}
