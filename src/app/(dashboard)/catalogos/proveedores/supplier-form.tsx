'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupplier, updateSupplier } from './_actions'
import { useState } from 'react'

interface Props {
  supplier?: {
    id: string
    code: string
    name: string
    rnc: string | null
    contactName: string | null
    phone: string | null
    email: string | null
    address: string | null
    paymentTermDays: number
  }
}

export function SupplierForm({ supplier }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!supplier

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      if (isEditing) {
        await updateSupplier(supplier.id, formData)
      } else {
        await createSupplier(formData)
      }
      router.push('/catalogos/proveedores')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={supplier?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={supplier?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnc">RNC</Label>
              <Input id="rnc" name="rnc" defaultValue={supplier?.rnc || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Persona de Contacto</Label>
              <Input id="contactName" name="contactName" defaultValue={supplier?.contactName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={supplier?.phone || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier?.email || ''} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={supplier?.address || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTermDays">Días de Pago</Label>
              <Input id="paymentTermDays" name="paymentTermDays" type="number" defaultValue={supplier?.paymentTermDays || 30} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Proveedor'}
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
