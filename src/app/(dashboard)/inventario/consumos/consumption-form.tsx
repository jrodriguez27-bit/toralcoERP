'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createConsumption } from './_actions'

interface Props {
  products: { value: string; label: string }[]
  warehouses: { value: string; label: string }[]
  projects: { value: string; label: string }[]
  costCodes: { value: string; label: string }[]
}

export function ConsumptionForm({ products, warehouses, projects, costCodes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [projectId, setProjectId] = useState('')
  const [costCodeId, setCostCodeId] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createConsumption({
        productId,
        warehouseId,
        quantity,
        projectId,
        costCodeId: costCodeId || null,
        notes: notes || null,
      })
      router.push('/inventario/consumos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar consumo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Consumo Directo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <EntitySelect
                value={productId}
                onValueChange={setProductId}
                options={products}
                placeholder="Seleccionar producto..."
              />
            </div>
            <div className="space-y-2">
              <Label>Almacen *</Label>
              <EntitySelect
                value={warehouseId}
                onValueChange={setWarehouseId}
                options={warehouses}
                placeholder="Seleccionar almacen..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Proyecto *</Label>
              <EntitySelect
                value={projectId}
                onValueChange={setProjectId}
                options={projects}
                placeholder="Seleccionar proyecto..."
              />
            </div>
            <div className="space-y-2">
              <Label>Codigo de Costo</Label>
              <EntitySelect
                value={costCodeId}
                onValueChange={setCostCodeId}
                options={costCodes}
                placeholder="Seleccionar codigo..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Consumo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/inventario/consumos')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
