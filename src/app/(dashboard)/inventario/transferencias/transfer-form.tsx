'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EntitySelect } from '@/components/shared/entity-select'
import { createTransfer } from './_actions'
import { Plus, Trash2 } from 'lucide-react'

interface TransferLineInput {
  id: string
  productId: string
  quantity: string
}

interface Props {
  warehouses: { value: string; label: string }[]
  products: { value: string; label: string; unit?: string }[]
}

let lineCounter = 0

export function TransferForm({ warehouses, products }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<TransferLineInput[]>([])

  const filteredDestinations = warehouses.filter((w) => w.value !== fromWarehouseId)

  const addLine = () => {
    lineCounter++
    setLines((prev) => [...prev, { id: `new-${lineCounter}`, productId: '', quantity: '' }])
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, field: keyof TransferLineInput, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (lines.length === 0) {
        throw new Error('Debe agregar al menos una linea')
      }

      const invalidLines = lines.filter((l) => !l.productId || !l.quantity)
      if (invalidLines.length > 0) {
        throw new Error('Todas las lineas deben tener producto y cantidad')
      }

      const result = await createTransfer({
        fromWarehouseId,
        toWarehouseId,
        notes: notes || null,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      })

      router.push(`/inventario/transferencias/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear transferencia')
    } finally {
      setLoading(false)
    }
  }

  const getProductUnit = (productId: string): string => {
    const product = products.find((p) => p.value === productId)
    return product?.unit || ''
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Almacen Origen *</Label>
                <EntitySelect
                  value={fromWarehouseId}
                  onValueChange={(v) => {
                    setFromWarehouseId(v)
                    if (v === toWarehouseId) setToWarehouseId('')
                  }}
                  options={warehouses}
                  placeholder="Seleccionar almacen origen..."
                />
              </div>
              <div className="space-y-2">
                <Label>Almacen Destino *</Label>
                <EntitySelect
                  value={toWarehouseId}
                  onValueChange={setToWarehouseId}
                  options={filteredDestinations}
                  placeholder="Seleccionar almacen destino..."
                  disabled={!fromWarehouseId}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Lines */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Lineas</h3>
                <Button type="button" size="sm" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Linea
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[300px]">Producto</TableHead>
                      <TableHead className="w-40">Cantidad</TableHead>
                      <TableHead className="w-20">Unidad</TableHead>
                      <TableHead className="w-16">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No hay lineas. Haga clic en &quot;Agregar Linea&quot; para comenzar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <EntitySelect
                              value={line.productId}
                              onValueChange={(v) => updateLine(line.id, 'productId', v)}
                              options={products}
                              placeholder="Seleccionar producto..."
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                              placeholder="0.00"
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getProductUnit(line.productId)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => removeLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !fromWarehouseId || !toWarehouseId || lines.length === 0}
              >
                {loading ? 'Creando...' : 'Crear Transferencia'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/inventario/transferencias')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
