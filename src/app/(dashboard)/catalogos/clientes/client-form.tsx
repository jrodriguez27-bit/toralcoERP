'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient, updateClient } from './_actions'
import { useState } from 'react'

interface Props {
  client?: {
    id: string
    code: string
    name: string
    rnc: string | null
    contactName: string | null
    phone: string | null
    email: string | null
    address: string | null
    creditLimit: string | null
    creditDays: number
  }
}

export function ClientForm({ client }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!client

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      if (isEditing) {
        await updateClient(client.id, formData)
      } else {
        await createClient(formData)
      }
      router.push('/catalogos/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={client?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={client?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnc">RNC</Label>
              <Input id="rnc" name="rnc" defaultValue={client?.rnc || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Persona de Contacto</Label>
              <Input id="contactName" name="contactName" defaultValue={client?.contactName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={client?.phone || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={client?.email || ''} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={client?.address || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Límite de Crédito (RD$)</Label>
              <Input id="creditLimit" name="creditLimit" type="number" step="0.01" defaultValue={client?.creditLimit || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditDays">Días de Crédito</Label>
              <Input id="creditDays" name="creditDays" type="number" defaultValue={client?.creditDays || 30} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cliente'}
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
