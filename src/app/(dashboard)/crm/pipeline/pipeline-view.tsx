'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { changeStage } from '../leads/_actions'
import Decimal from 'decimal.js'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  company: string | null
  stage: string
  estimatedValue: string | null
  probability: number | null
  nextFollowUp: string | null
}

const STAGES = [
  { value: 'NEW', label: 'Nuevo', color: 'bg-slate-500' },
  { value: 'CONTACTED', label: 'Contactado', color: 'bg-blue-500' },
  { value: 'QUALIFIED', label: 'Calificado', color: 'bg-purple-500' },
  { value: 'PROPOSAL', label: 'Propuesta', color: 'bg-amber-500' },
  { value: 'NEGOTIATION', label: 'Negociacion', color: 'bg-orange-500' },
  { value: 'WON', label: 'Ganado', color: 'bg-green-500' },
  { value: 'LOST', label: 'Perdido', color: 'bg-red-500' },
]

export function PipelineView({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getLeadsByStage = (stage: string) => leads.filter((l) => l.stage === stage)

  const getStageTotal = (stage: string) => {
    const stageLeads = getLeadsByStage(stage)
    const total = stageLeads.reduce((acc, l) => {
      return acc.plus(l.estimatedValue ? new Decimal(l.estimatedValue) : new Decimal(0))
    }, new Decimal(0))
    return total.toString()
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId)
    setDraggedId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('text/plain')
    setDraggedId(null)

    if (!leadId) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage === targetStage) return

    setLoading(true)
    try {
      await changeStage(leadId, targetStage)
      router.refresh()
    } catch (err) {
      console.error('Error changing stage:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
      {STAGES.map((stage) => {
        const stageLeads = getLeadsByStage(stage.value)
        const total = getStageTotal(stage.value)

        return (
          <div
            key={stage.value}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.value)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {formatCurrency(total)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className={`p-3 rounded-lg border bg-background cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedId === lead.id ? 'opacity-50' : ''
                    } ${loading ? 'pointer-events-none' : ''}`}
                  >
                    <Link href={`/crm/leads/${lead.id}`} className="block">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                      )}
                      {lead.estimatedValue && (
                        <p className="text-xs font-semibold mt-1 text-green-700">
                          {formatCurrency(lead.estimatedValue)}
                        </p>
                      )}
                      {lead.probability != null && (
                        <p className="text-xs text-muted-foreground">
                          {lead.probability}% probabilidad
                        </p>
                      )}
                    </Link>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Arrastra leads aqui
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
