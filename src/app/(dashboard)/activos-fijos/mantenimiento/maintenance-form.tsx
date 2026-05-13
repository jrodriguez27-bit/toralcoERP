'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createMaintenance, updateMaintenance } from './_actions'

interface MaintenanceData {
  id: string
  assetId: string
  type: string
  description: string
  scheduledDate: string | null
  cost: string
  vendor: string | null
  notes: string | null
  status: string
}

interface Props {
  maintenance?: MaintenanceData
  assets: { value: string; label: string }[]
}

export function MaintenanceForm({ maintenance, assets }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assetId, setAssetId] = useState(maintenance?.assetId || '')
  const [type, setType] = useState(maintenance?.type || '')

  const isEditing = !!maintenance

  const typeOptions = [
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'CORRECTIVE', label: 'Correctivo' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('assetId', assetId)
      formData.set('type', type)

      if (isEditing) {
        await updateMaintenance(maintenance.id, formData)
        router.push('/activos-fijos/mantenimiento')
      } else {
        await createMaintenance(formData)
        router.push('/activos-fijos/mantenimiento')
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
        <CardTitle>{isEditing ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Activo *</Label>
              <EntitySelect
                value={assetId}
                onValueChange={setAssetId}
                options={assets}
                placeholder="Seleccionar activo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <EntitySelect
                value={type}
                onValueChange={setType}
                options={typeOptions}
                placeholder="Seleccionar tipo..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripcion *</Label>
              <Input
                id="description"
                name="description"
                required
                defaultValue={maintenance?.description || ''}
                placeholder="Descripcion del mantenimiento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Fecha Programada</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                defaultValue={maintenance?.scheduledDate?.split('T')[0] || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Costo</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={maintenance?.cost || '0'}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Proveedor</Label>
              <Input
                id="vendor"
                name="vendor"
                defaultValue={maintenance?.vendor || ''}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={maintenance?.notes || ''}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Mantenimiento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/activos-fijos/mantenimiento')}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
