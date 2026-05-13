'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EntitySelect } from '@/components/shared/entity-select'
import { changeStage, addActivity, convertLead } from '../_actions'
import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Phone,
  Mail,
  Building2,
  User,
  CalendarDays,
  ArrowRightLeft,
  Plus,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'

const STAGES = [
  { value: 'NEW', label: 'Nuevo', color: 'bg-slate-100 text-slate-700' },
  { value: 'CONTACTED', label: 'Contactado', color: 'bg-blue-100 text-blue-700' },
  { value: 'QUALIFIED', label: 'Calificado', color: 'bg-purple-100 text-purple-700' },
  { value: 'PROPOSAL', label: 'Propuesta', color: 'bg-amber-100 text-amber-700' },
  { value: 'NEGOTIATION', label: 'Negociacion', color: 'bg-orange-100 text-orange-700' },
  { value: 'WON', label: 'Ganado', color: 'bg-green-100 text-green-700' },
  { value: 'LOST', label: 'Perdido', color: 'bg-red-100 text-red-700' },
]

const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Llamada' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Reunion' },
  { value: 'NOTE', label: 'Nota' },
]

const activityTypeLabels: Record<string, string> = {
  CALL: 'Llamada',
  EMAIL: 'Email',
  MEETING: 'Reunion',
  NOTE: 'Nota',
}

interface LeadData {
  id: string
  name: string
  company: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  source: string | null
  stage: string
  estimatedValue: string | null
  probability: number | null
  assignedTo: string | null
  nextFollowUp: string | null
  notes: string | null
  clientId: string | null
  wonDate: string | null
  lostDate: string | null
  lostReason: string | null
  createdAt: string
  client: { id: string; name: string; code: string } | null
  activities: {
    id: string
    type: string
    description: string
    date: string
    createdBy: string | null
  }[]
  proposals: {
    id: string
    number: string
    title: string
    status: string
    totalAmount: string
    createdAt: string
  }[]
}

export function LeadDetail({ lead }: { lead: LeadData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityType, setActivityType] = useState('NOTE')
  const [activityDescription, setActivityDescription] = useState('')
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0])

  const handleChangeStage = async (stage: string) => {
    setLoading(true)
    setError('')
    try {
      await changeStage(lead.id, stage)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar etapa')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!activityDescription.trim()) return
    setLoading(true)
    setError('')
    try {
      await addActivity({
        leadId: lead.id,
        type: activityType,
        description: activityDescription,
        date: activityDate,
      })
      setActivityDescription('')
      setShowActivityForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar actividad')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    setLoading(true)
    setError('')
    try {
      await convertLead(lead.id)
      setShowConvertDialog(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          {lead.company && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-4 w-4" /> {lead.company}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={lead.stage} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/crm/leads/${lead.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Lead Info + Stage Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informacion del Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {lead.contactName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.contactName}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}
              {lead.nextFollowUp && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Seguimiento: {formatDate(lead.nextFollowUp)}</span>
                </div>
              )}
              {lead.estimatedValue && (
                <div>
                  <span className="text-sm text-muted-foreground">Valor Estimado: </span>
                  <span className="text-sm font-semibold">{formatCurrency(lead.estimatedValue)}</span>
                </div>
              )}
              {lead.probability != null && (
                <div>
                  <span className="text-sm text-muted-foreground">Probabilidad: </span>
                  <span className="text-sm font-semibold">{lead.probability}%</span>
                </div>
              )}
              {lead.source && (
                <div>
                  <span className="text-sm text-muted-foreground">Fuente: </span>
                  <span className="text-sm">{lead.source}</span>
                </div>
              )}
              {lead.assignedTo && (
                <div>
                  <span className="text-sm text-muted-foreground">Asignado a: </span>
                  <span className="text-sm">{lead.assignedTo}</span>
                </div>
              )}
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Notas:</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
            {lead.client && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Cliente asociado:</p>
                <Link href={`/catalogos/clientes/${lead.client.id}`} className="text-sm text-blue-600 hover:underline">
                  {lead.client.code} - {lead.client.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {STAGES.map((s) => (
              <Button
                key={s.value}
                variant={lead.stage === s.value ? 'default' : 'outline'}
                className="w-full justify-start"
                size="sm"
                disabled={loading || lead.stage === s.value}
                onClick={() => handleChangeStage(s.value)}
              >
                {s.label}
              </Button>
            ))}

            {lead.stage === 'WON' && !lead.clientId && (
              <div className="pt-4 border-t mt-4">
                <Button
                  className="w-full"
                  onClick={() => setShowConvertDialog(true)}
                  disabled={loading}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convertir a Cliente
                </Button>
              </div>
            )}

            <div className="pt-4 border-t mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/crm/leads')}
              >
                Volver a Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Propuestas ({lead.proposals.length})</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/crm/propuestas/nuevo?leadId=${lead.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propuesta
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lead.proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay propuestas para este lead.
            </p>
          ) : (
            <div className="space-y-3">
              {lead.proposals.map((p) => (
                <Link
                  key={p.id}
                  href={`/crm/propuestas/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm">{p.number}</span>
                    <span className="text-muted-foreground text-sm ml-2">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(p.totalAmount)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actividades ({lead.activities.length})</CardTitle>
            <Button size="sm" onClick={() => setShowActivityForm(true)} disabled={showActivityForm}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Actividad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showActivityForm && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <EntitySelect
                    value={activityType}
                    onValueChange={setActivityType}
                    options={ACTIVITY_TYPES}
                    placeholder="Tipo..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripcion *</Label>
                <Textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripcion de la actividad..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddActivity}
                  disabled={loading || !activityDescription.trim()}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowActivityForm(false)
                    setActivityDescription('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {lead.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividades registradas.
            </p>
          ) : (
            <div className="space-y-4">
              {lead.activities.map((a) => (
                <div key={a.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="outline">{activityTypeLabels[a.type] || a.type}</Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(a.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convert Dialog */}
      <ConfirmDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        title="Convertir Lead a Cliente"
        description={`Se creara un nuevo cliente "${lead.company || lead.name}" y un proyecto asociado. Esta accion no se puede deshacer.`}
        confirmLabel="Convertir"
        onConfirm={handleConvert}
      />
    </div>
  )
}
