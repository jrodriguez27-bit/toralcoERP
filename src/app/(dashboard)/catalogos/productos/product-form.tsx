'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProduct, updateProduct } from './_actions'
import { useState } from 'react'

interface Props {
  product?: {
    id: string
    code: string
    name: string
    description: string | null
    unit: string
    category: string | null
    minStock: string
    maxStock: string | null
  }
}

export function ProductForm({ product }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!product

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      if (isEditing) {
        await updateProduct(product.id, formData)
      } else {
        await createProduct(formData)
      }
      router.push('/catalogos/productos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={product?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={product?.name} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={product?.description || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad *</Label>
              <Input id="unit" name="unit" defaultValue={product?.unit || 'UND'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" name="category" defaultValue={product?.category || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo</Label>
              <Input id="minStock" name="minStock" type="number" step="0.01" defaultValue={product?.minStock || '0'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Stock Máximo</Label>
              <Input id="maxStock" name="maxStock" type="number" step="0.01" defaultValue={product?.maxStock || ''} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
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
