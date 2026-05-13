'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createAdjustment } from './_actions'

interface Props {
  products: { value: string; label: string }[]
  warehouses: { value: string; label: string }[]
}

const adjustmentTypes = [
  { value: 'ADJUSTMENT_IN', label: 'Ajuste Entrada (Incremento)' },
  { value: 'ADJUSTMENT_OUT', label: 'Ajuste Salida (Decremento)' },
]

export function AdjustmentForm({ products, warehouses }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<string>('')
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')

  const isEntry = type === 'ADJUSTMENT_IN'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createAdjustment({
        productId,
        warehouseId,
        type: type as 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT',
        quantity,
        unitCost: isEntry ? unitCost || '0' : undefined,
        notes: notes || null,
      })
      router.push('/inventario/ajustes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar ajuste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Ajuste de Inventario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Ajuste *</Label>
              <EntitySelect
                value={type}
                onValueChange={setType}
                options={adjustmentTypes}
                placeholder="Seleccionar tipo..."
              />
            </div>
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
            {isEntry && (
              <div className="space-y-2">
                <Label htmlFor="unitCost">Costo Unitario</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Justificacion</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Motivo del ajuste..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !type}>
              {loading ? 'Registrando...' : 'Registrar Ajuste'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/inventario/ajustes')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
