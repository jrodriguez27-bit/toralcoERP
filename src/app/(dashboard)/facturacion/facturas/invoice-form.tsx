'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { createClientInvoice } from './_actions'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface LineInput {
  productId: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

interface Props {
  clients: { value: string; label: string }[]
  products: { value: string; label: string; description?: string }[]
}

const NCF_TYPE_OPTIONS = [
  { value: '_none', label: 'Sin NCF' },
  { value: 'B01', label: 'B01 - Credito Fiscal' },
  { value: 'B02', label: 'B02 - Consumidor Final' },
  { value: 'B14', label: 'B14 - Gubernamental' },
  { value: 'B15', label: 'B15 - Regimenes Especiales' },
]

export function InvoiceForm({ clients, products }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientId, setClientId] = useState('')
  const [ncfType, setNcfType] = useState('_none')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineInput[]>([])

  // New line form
  const [showNewLine, setShowNewLine] = useState(false)
  const [newProductId, setNewProductId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newTaxRate, setNewTaxRate] = useState('0.18')

  const addLine = () => {
    if (!newDescription || !newQuantity || !newUnitPrice) return

    setLines([
      ...lines,
      {
        productId: newProductId,
        description: newDescription,
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        taxRate: newTaxRate,
      },
    ])

    setNewProductId('')
    setNewDescription('')
    setNewQuantity('')
    setNewUnitPrice('')
    setNewTaxRate('0.18')
    setShowNewLine(false)
  }

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const computeLineTotal = (qty: string, price: string, tax: string): string => {
    try {
      if (!qty || !price) return formatCurrency('0')
      const subtotal = new Decimal(qty).times(new Decimal(price))
      const taxAmt = subtotal.times(new Decimal(tax || '0'))
      return formatCurrency(subtotal.plus(taxAmt).toString())
    } catch {
      return formatCurrency('0')
    }
  }

  const computeSubtotal = (): Decimal => {
    return lines.reduce((acc, line) => {
      try {
        return acc.plus(new Decimal(line.quantity).times(new Decimal(line.unitPrice)))
      } catch {
        return acc
      }
    }, new Decimal(0))
  }

  const computeTax = (): Decimal => {
    return lines.reduce((acc, line) => {
      try {
        const sub = new Decimal(line.quantity).times(new Decimal(line.unitPrice))
        return acc.plus(sub.times(new Decimal(line.taxRate || '0')))
      } catch {
        return acc
      }
    }, new Decimal(0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await createClientInvoice({
        clientId,
        ncfType: ncfType === '_none' ? null : ncfType,
        invoiceDate,
        dueDate,
        notes: notes || null,
        lines: lines.map((l) => ({
          productId: l.productId || null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      })
      router.push(`/facturacion/facturas/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (value: string) => {
    setNewProductId(value)
    const product = products.find((p) => p.value === value)
    if (product) {
      setNewDescription(product.description || product.label.split(' - ').slice(1).join(' - '))
    }
  }

  const subtotal = computeSubtotal()
  const tax = computeTax()
  const total = subtotal.plus(tax)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <EntitySelect
                  value={clientId}
                  onValueChange={setClientId}
                  options={clients}
                  placeholder="Seleccionar cliente..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo NCF</Label>
                <EntitySelect
                  value={ncfType}
                  onValueChange={setNcfType}
                  options={NCF_TYPE_OPTIONS}
                  placeholder="Sin NCF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Fecha de Factura *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lineas de la Factura</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowNewLine(true)}
              disabled={showNewLine}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Linea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">ITBIS</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => {
                  const product = products.find((p) => p.value === line.productId)
                  return (
                    <TableRow key={index}>
                      <TableCell>{product ? product.label : '-'}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                      <TableCell className="text-right">{(parseFloat(line.taxRate) * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {computeLineTotal(line.quantity, line.unitPrice, line.taxRate)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {showNewLine && (
                  <TableRow>
                    <TableCell>
                      <EntitySelect
                        value={newProductId}
                        onValueChange={handleProductSelect}
                        options={products}
                        placeholder="Producto..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Descripcion"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="0"
                        className="text-right w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newUnitPrice}
                        onChange={(e) => setNewUnitPrice(e.target.value)}
                        placeholder="0.00"
                        className="text-right w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newTaxRate}
                        onChange={(e) => setNewTaxRate(e.target.value)}
                        className="text-right w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {computeLineTotal(newQuantity, newUnitPrice, newTaxRate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={addLine}
                          disabled={!newDescription || !newQuantity || !newUnitPrice}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNewLine(false)
                            setNewProductId('')
                            setNewDescription('')
                            setNewQuantity('')
                            setNewUnitPrice('')
                            setNewTaxRate('0.18')
                          }}
                        >
                          X
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {lines.length === 0 && !showNewLine && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay lineas en esta factura. Agregue al menos una linea.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="space-y-1 text-right">
              <div className="flex justify-between gap-8">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal.toString())}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-sm text-muted-foreground">ITBIS:</span>
                <span className="font-medium">{formatCurrency(tax.toString())}</span>
              </div>
              <div className="flex justify-between gap-8 pt-2 border-t">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-xl font-bold">{formatCurrency(total.toString())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading || !clientId || !invoiceDate || !dueDate || lines.length === 0}
        >
          {loading ? 'Guardando...' : 'Crear Factura'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
