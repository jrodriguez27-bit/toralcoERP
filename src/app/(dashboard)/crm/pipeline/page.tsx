import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/utils'
import { PipelineView } from './pipeline-view'

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      company: true,
      stage: true,
      estimatedValue: true,
      probability: true,
      nextFollowUp: true,
    },
  })

  const serialized = leads.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    stage: l.stage,
    estimatedValue: l.estimatedValue ? serializeDecimal(l.estimatedValue) : null,
    probability: l.probability,
    nextFollowUp: l.nextFollowUp ? l.nextFollowUp.toISOString() : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline de Ventas</h1>
        <p className="text-muted-foreground">Vista de pipeline con todas las etapas</p>
      </div>
      <PipelineView leads={serialized} />
    </div>
  )
}
