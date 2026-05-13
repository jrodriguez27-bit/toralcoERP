'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createCostCode, updateCostCode } from './_actions'
import { useState } from 'react'

interface Props {
  costCode?: {
    id: string
    code: string
    name: string
    description: string | null
    accountId: string | null
  }
  accounts: { value: string; label: string }[]
}

export function CostCodeForm({ costCode, accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountId, setAccountId] = useState(costCode?.accountId || '')
  const isEditing = !!costCode

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('accountId', accountId)
      if (isEditing) {
        await updateCostCode(costCode.id, formData)
      } else {
        await createCostCode(formData)
      }
      router.push('/catalogos/codigos-costo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Código de Costo' : 'Nuevo Código de Costo'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={costCode?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={costCode?.name} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={costCode?.description || ''} />
            </div>
            <div className="space-y-2">
              <Label>Cuenta Contable</Label>
              <EntitySelect
                value={accountId}
                onValueChange={setAccountId}
                options={accounts}
                placeholder="Seleccionar cuenta..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Código de Costo'}
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
