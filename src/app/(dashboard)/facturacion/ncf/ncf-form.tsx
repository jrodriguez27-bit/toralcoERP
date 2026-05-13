'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createNcfSequence, updateNcfSequence } from './_actions'

const NCF_TYPE_OPTIONS = [
  { value: 'B01', label: 'B01 - Credito Fiscal' },
  { value: 'B02', label: 'B02 - Consumidor Final' },
  { value: 'B14', label: 'B14 - Gubernamental' },
  { value: 'B15', label: 'B15 - Regimenes Especiales' },
]

interface Props {
  sequence?: {
    id: string
    type: string
    prefix: string
    currentNumber: number
    rangeFrom: number
    rangeTo: number
    expirationDate: string | null
    isActive: boolean
  }
}

export function NcfForm({ sequence }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState(sequence?.type || '')
  const isEditing = !!sequence

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', type)

      if (isEditing) {
        await updateNcfSequence(sequence.id, formData)
        router.push('/facturacion/ncf')
      } else {
        await createNcfSequence(formData)
        router.push('/facturacion/ncf')
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
        <CardTitle>{isEditing ? 'Editar Secuencia NCF' : 'Nueva Secuencia NCF'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Comprobante *</Label>
              <EntitySelect
                value={type}
                onValueChange={setType}
                options={NCF_TYPE_OPTIONS}
                placeholder="Seleccionar tipo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefijo *</Label>
              <Input
                id="prefix"
                name="prefix"
                defaultValue={sequence?.prefix || ''}
                placeholder="Ej: B01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rangeFrom">Rango Desde *</Label>
              <Input
                id="rangeFrom"
                name="rangeFrom"
                type="number"
                min="1"
                defaultValue={sequence?.rangeFrom || ''}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rangeTo">Rango Hasta *</Label>
              <Input
                id="rangeTo"
                name="rangeTo"
                type="number"
                min="1"
                defaultValue={sequence?.rangeTo || ''}
                placeholder="50000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
              <Input
                id="expirationDate"
                name="expirationDate"
                type="date"
                defaultValue={sequence?.expirationDate ? sequence.expirationDate.split('T')[0] : ''}
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label>Numero Actual</Label>
                <Input value={sequence.currentNumber} disabled />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Secuencia'}
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
