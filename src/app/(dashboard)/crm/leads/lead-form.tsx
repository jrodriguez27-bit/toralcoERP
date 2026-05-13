'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createLead, updateLead } from './_actions'
import { useState } from 'react'

const sourceOptions = [
  { value: 'Referido', label: 'Referido' },
  { value: 'Web', label: 'Web' },
  { value: 'Llamada', label: 'Llamada' },
  { value: 'Evento', label: 'Evento' },
  { value: 'Otro', label: 'Otro' },
]

const stageOptions = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'QUALIFIED', label: 'Calificado' },
  { value: 'PROPOSAL', label: 'Propuesta' },
  { value: 'NEGOTIATION', label: 'Negociacion' },
  { value: 'WON', label: 'Ganado' },
  { value: 'LOST', label: 'Perdido' },
]

interface Props {
  lead?: {
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
  }
}

export function LeadForm({ lead }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState(lead?.source || '')
  const isEditing = !!lead

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('source', source)
      if (isEditing) {
        await updateLead(lead.id, formData)
        router.refresh()
        router.push(`/crm/leads/${lead.id}`)
      } else {
        const result = await createLead(formData)
        router.push(`/crm/leads/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Lead' : 'Nuevo Lead'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Lead *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={lead?.name || ''}
                required
                placeholder="Nombre del proyecto u oportunidad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                name="company"
                defaultValue={lead?.company || ''}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Persona de Contacto</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={lead?.contactName || ''}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={lead?.email || ''}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={lead?.phone || ''}
                placeholder="809-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Fuente</Label>
              <EntitySelect
                value={source}
                onValueChange={setSource}
                options={sourceOptions}
                placeholder="Seleccionar fuente..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Valor Estimado (RD$)</Label>
              <Input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={lead?.estimatedValue || ''}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidad (%)</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={lead?.probability ?? ''}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Asignado a</Label>
              <Input
                id="assignedTo"
                name="assignedTo"
                defaultValue={lead?.assignedTo || ''}
                placeholder="Responsable"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextFollowUp">Proximo Seguimiento</Label>
              <Input
                id="nextFollowUp"
                name="nextFollowUp"
                type="date"
                defaultValue={lead?.nextFollowUp || ''}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={lead?.notes || ''}
                rows={3}
                placeholder="Notas adicionales sobre el lead..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Lead'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
