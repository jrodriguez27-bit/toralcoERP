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
import { createSupplierInvoice } from './_actions'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface POLine {
  productId: string
  productLabel: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

interface PurchaseOrderOption {
  value: string
  label: string
  supplierId: string
  lines: POLine[]
}

interface InvoiceLine {
  id: string
  productId: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

interface Props {
  suppliers: { value: string; label: string }[]
  products: { value: string; label: string }[]
  purchaseOrders: PurchaseOrderOption[]
}

let lineIdCounter = 0
function newLineId() {
  lineIdCounter += 1
  return `line-${lineIdCounter}`
}

export function InvoiceForm({ suppliers, products, purchaseOrders }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Header state
  const [supplierId, setSupplierId] = useState('')
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [supplierInvNumber, setSupplierInvNumber] = useState('')
  const [ncf, setNcf] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isrRetention, setIsrRetention] = useState('0')
  const [itbisRetention, setItbisRetention] = useState('0')
  const [notes, setNotes] = useState('')

  // Lines state
  const [lines, setLines] = useState<InvoiceLine[]>([])

  // Filter POs by selected supplier
  const filteredPOs = supplierId
    ? purchaseOrders.filter((po) => po.supplierId === supplierId)
    : purchaseOrders

  const handlePOChange = (poId: string) => {
    setPurchaseOrderId(poId)
    if (poId) {
      const selectedPO = purchaseOrders.find((po) => po.value === poId)
      if (selectedPO) {
        // Auto-set supplier
        if (!supplierId) {
          setSupplierId(selectedPO.supplierId)
        }
        // Populate lines from PO
        const poLines: InvoiceLine[] = selectedPO.lines.map((l) => ({
          id: newLineId(),
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        }))
        setLines(poLines)
      }
    }
  }

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: newLineId(),
        productId: '',
        description: '',
        quantity: '1',
        unitPrice: '0',
        taxRate: '0.18',
      },
    ])
  }

  const removeLine = (lineId: string) => {
    setLines(lines.filter((l) => l.id !== lineId))
  }

  const updateLine = (lineId: string, field: keyof InvoiceLine, value: string) => {
    setLines(lines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)))
  }

  const computeLineTotal = (line: InvoiceLine): Decimal => {
    try {
      const qty = new Decimal(line.quantity || '0')
      const price = new Decimal(line.unitPrice || '0')
      const rate = new Decimal(line.taxRate || '0')
      return qty.times(price).times(new Decimal(1).plus(rate))
    } catch {
      return new Decimal(0)
    }
  }

  const computeTotals = () => {
    let subtotal = new Decimal(0)
    let tax = new Decimal(0)

    for (const line of lines) {
      try {
        const qty = new Decimal(line.quantity || '0')
        const price = new Decimal(line.unitPrice || '0')
        const rate = new Decimal(line.taxRate || '0')
        const lineSubtotal = qty.times(price)
        subtotal = subtotal.plus(lineSubtotal)
        tax = tax.plus(lineSubtotal.times(rate))
      } catch {
        // Skip invalid lines
      }
    }

    const isr = new Decimal(isrRetention || '0')
    const itbis = new Decimal(itbisRetention || '0')
    const total = subtotal.plus(tax).minus(isr).minus(itbis)

    return { subtotal, tax, isr, itbis, total }
  }

  const totals = computeTotals()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (lines.length === 0) {
        throw new Error('Debe agregar al menos una linea')
      }

      const result = await createSupplierInvoice({
        supplierId,
        purchaseOrderId: purchaseOrderId || null,
        supplierInvNumber: supplierInvNumber || null,
        ncf: ncf || null,
        invoiceDate,
        dueDate,
        isrRetention,
        itbisRetention,
        notes: notes || null,
        lines: lines.map((l) => ({
          productId: l.productId || null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      })

      router.push(`/compras/facturas-proveedor/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva Factura de Proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <EntitySelect
                value={supplierId}
                onValueChange={(value) => {
                  setSupplierId(value)
                  // Clear PO selection when supplier changes
                  setPurchaseOrderId('')
                }}
                options={suppliers}
                placeholder="Seleccionar proveedor..."
              />
            </div>

            <div className="space-y-2">
              <Label>Orden de Compra</Label>
              <EntitySelect
                value={purchaseOrderId}
                onValueChange={handlePOChange}
                options={filteredPOs.map((po) => ({ value: po.value, label: po.label }))}
                placeholder="Seleccionar OC (opcional)..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierInvNumber">No. Factura Proveedor</Label>
              <Input
                id="supplierInvNumber"
                value={supplierInvNumber}
                onChange={(e) => setSupplierInvNumber(e.target.value)}
                placeholder="Numero de factura del proveedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncf">NCF</Label>
              <Input
                id="ncf"
                value={ncf}
                onChange={(e) => setNcf(e.target.value)}
                placeholder="Comprobante fiscal"
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

            <div className="space-y-2 md:col-span-3">
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
        </CardContent>
      </Card>

      {/* Lines Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lineas de la Factura</CardTitle>
            <Button type="button" size="sm" onClick={addLine}>
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
                  <TableHead className="w-48">Producto</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="w-28 text-right">Cantidad</TableHead>
                  <TableHead className="w-32 text-right">Precio Unit.</TableHead>
                  <TableHead className="w-24 text-right">ITBIS %</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <EntitySelect
                        value={line.productId}
                        onValueChange={(val) => updateLine(line.id, 'productId', val)}
                        options={products}
                        placeholder="Producto..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder="Descripcion"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                        className="text-right"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                        className="text-right"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={line.taxRate}
                        onChange={(e) => updateLine(line.id, 'taxRate', e.target.value)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(computeLineTotal(line).toFixed(2))}
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
                ))}
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay lineas. Haga clic en &quot;Agregar Linea&quot; o seleccione una Orden de Compra.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Retentions & Totals Card */}
      <Card>
        <CardHeader>
          <CardTitle>Retenciones y Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Retentions */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Retenciones</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isrRetention">Retencion ISR</Label>
                  <Input
                    id="isrRetention"
                    type="number"
                    step="0.01"
                    min="0"
                    value={isrRetention}
                    onChange={(e) => setIsrRetention(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itbisRetention">Retencion ITBIS</Label>
                  <Input
                    id="itbisRetention"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itbisRetention}
                    onChange={(e) => setItbisRetention(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Totales</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal.toFixed(2))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS:</span>
                  <span className="font-medium">
                    {formatCurrency(totals.tax.toFixed(2))}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retencion ISR:</span>
                  <span>-{formatCurrency(totals.isr.toFixed(2))}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retencion ITBIS:</span>
                  <span>-{formatCurrency(totals.itbis.toFixed(2))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold text-base">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(totals.total.toFixed(2))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Factura'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
