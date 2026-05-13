'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createAccount, updateAccount } from './_actions'
import { useState } from 'react'

interface Props {
  account?: {
    id: string
    code: string
    name: string
    type: string
    nature: string
    parentId: string | null
    level: number
    acceptsEntries: boolean
  }
  accounts: { value: string; label: string }[]
}

export function AccountForm({ account, accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState(account?.type || 'ASSET')
  const [nature, setNature] = useState(account?.nature || 'DEBIT')
  const [parentId, setParentId] = useState(account?.parentId || '')
  const [acceptsEntries, setAcceptsEntries] = useState(account?.acceptsEntries ?? true)
  const isEditing = !!account

  const typeOptions = [
    { value: 'ASSET', label: 'Activo' },
    { value: 'LIABILITY', label: 'Pasivo' },
    { value: 'EQUITY', label: 'Capital' },
    { value: 'INCOME', label: 'Ingreso' },
    { value: 'EXPENSE', label: 'Gasto' },
    { value: 'COST', label: 'Costo' },
  ]

  const natureOptions = [
    { value: 'DEBIT', label: 'Débito' },
    { value: 'CREDIT', label: 'Crédito' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', type)
      formData.set('nature', nature)
      formData.set('parentId', parentId)
      formData.set('acceptsEntries', acceptsEntries ? 'true' : 'false')
      if (isEditing) {
        await updateAccount(account.id, formData)
      } else {
        await createAccount(formData)
      }
      router.push('/catalogos/cuentas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={account?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={account?.name} required />
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
            <div className="space-y-2">
              <Label>Naturaleza *</Label>
              <EntitySelect
                value={nature}
                onValueChange={setNature}
                options={natureOptions}
                placeholder="Seleccionar naturaleza..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cuenta Padre</Label>
              <EntitySelect
                value={parentId}
                onValueChange={setParentId}
                options={accounts}
                placeholder="Sin cuenta padre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Input id="level" name="level" type="number" min="1" defaultValue={account?.level || 1} />
            </div>
            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input
                id="acceptsEntriesCheckbox"
                type="checkbox"
                checked={acceptsEntries}
                onChange={(e) => setAcceptsEntries(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="acceptsEntriesCheckbox" className="mb-0">Acepta Asientos</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cuenta'}
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
