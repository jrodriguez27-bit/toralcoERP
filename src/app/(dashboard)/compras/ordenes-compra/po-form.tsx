'use client'

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
import { StatusBadge } from '@/components/shared/status-badge'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  addPOLine,
  removePOLine,
  submitPO,
  approvePO,
  cancelPO,
  receiveItems,
} from './_actions'
import { useState } from 'react'
import { Plus, Trash2, Send, CheckCircle, Ban, PackageCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface POLineData {
  id: string
  productId: string
  productName: string
  productUnit: string
  costCodeId: string | null
  costCodeName: string | null
  description: string | null
  quantity: string
  unitPrice: string
  taxRate: string
  totalAmount: string
  quantityReceived: string
}

interface Props {
  order?: {
    id: string
    number: string
    supplierId: string
    projectId: string
    requisitionId: string | null
    requisitionNumber: string | null
    status: string
    subtotal: string
    taxAmount: string
    totalAmount: string
    deliveryDate: string | null
    paymentTermDays: number
    notes: string | null
    approvedBy: string | null
    lines: POLineData[]
  }
  suppliers: { value: string; label: string }[]
  projects: { value: string; label: string }[]
  products: { value: string; label: string; unit?: string }[]
  costCodes: { value: string; label: string }[]
}

export function POForm({ order, suppliers, projects, products, costCodes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supplierId, setSupplierId] = useState(order?.supplierId || '')
  const [projectId, setProjectId] = useState(order?.projectId || '')
  const isEditing = !!order
  const isDraft = !order || order.status === 'DRAFT'
  const isPending = order?.status === 'PENDING_APPROVAL'
  const isApproved = order?.status === 'APPROVED'
  const isPartiallyReceived = order?.status === 'PARTIALLY_RECEIVED'
  const canReceive = isApproved || isPartiallyReceived
  const canCancel =
    order &&
    order.status !== 'RECEIVED' &&
    order.status !== 'CANCELLED'

  // New line form state
  const [showNewLine, setShowNewLine] = useState(false)
  const [newLineProductId, setNewLineProductId] = useState('')
  const [newLineCostCodeId, setNewLineCostCodeId] = useState('')
  const [newLineDescription, setNewLineDescription] = useState('')
  const [newLineQuantity, setNewLineQuantity] = useState('')
  const [newLineUnitPrice, setNewLineUnitPrice] = useState('')
  const [newLineTaxRate, setNewLineTaxRate] = useState('0.18')
  const [lineLoading, setLineLoading] = useState(false)

  // Receive state
  const [receiveLineId, setReceiveLineId] = useState<string | null>(null)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveLoading, setReceiveLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('supplierId', supplierId)
      formData.set('projectId', projectId)
      if (isEditing) {
        await updatePurchaseOrder(order.id, formData)
        router.refresh()
      } else {
        const result = await createPurchaseOrder(formData)
        router.push(`/compras/ordenes-compra/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLine = async () => {
    if (!order) return
    setLineLoading(true)
    setError('')

    try {
      await addPOLine(order.id, {
        productId: newLineProductId,
        costCodeId: newLineCostCodeId || null,
        description: newLineDescription || null,
        quantity: newLineQuantity,
        unitPrice: newLineUnitPrice,
        taxRate: newLineTaxRate,
      })
      resetNewLineForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar linea')
    } finally {
      setLineLoading(false)
    }
  }

  const resetNewLineForm = () => {
    setShowNewLine(false)
    setNewLineProductId('')
    setNewLineCostCodeId('')
    setNewLineDescription('')
    setNewLineQuantity('')
    setNewLineUnitPrice('')
    setNewLineTaxRate('0.18')
  }

  const handleRemoveLine = async (lineId: string) => {
    setLineLoading(true)
    setError('')

    try {
      await removePOLine(lineId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar linea')
    } finally {
      setLineLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!order) return
    setLoading(true)
    setError('')

    try {
      await submitPO(order.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar a aprobacion')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!order) return
    setLoading(true)
    setError('')

    try {
      await approvePO(order.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    setLoading(true)
    setError('')

    try {
      await cancelPO(order.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setLoading(false)
    }
  }

  const handleReceive = async (lineId: string) => {
    setReceiveLoading(true)
    setError('')

    try {
      await receiveItems(lineId, receiveQty)
      setReceiveLineId(null)
      setReceiveQty('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al recibir items')
    } finally {
      setReceiveLoading(false)
    }
  }

  const computeNewLineTotal = (): string => {
    try {
      if (!newLineQuantity || !newLineUnitPrice) return formatCurrency('0')
      const subtotal = new Decimal(newLineQuantity).times(new Decimal(newLineUnitPrice))
      const tax = subtotal.times(new Decimal(newLineTaxRate || '0'))
      return formatCurrency(subtotal.plus(tax).toString())
    } catch {
      return formatCurrency('0')
    }
  }

  const formatTaxPercent = (rate: string): string => {
    try {
      return `${new Decimal(rate).times(100).toFixed(0)}%`
    } catch {
      return '0%'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isEditing ? `Orden de Compra ${order.number}` : 'Nueva Orden de Compra'}
              </CardTitle>
              {order?.requisitionNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                  Generada desde requisicion: {order.requisitionNumber}
                </p>
              )}
            </div>
            {order && <StatusBadge status={order.status} />}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <EntitySelect
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={suppliers}
                  placeholder="Seleccionar proveedor..."
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label>Proyecto *</Label>
                <EntitySelect
                  value={projectId}
                  onValueChange={setProjectId}
                  options={projects}
                  placeholder="Seleccionar proyecto..."
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="date"
                  defaultValue={order?.deliveryDate || ''}
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTermDays">Dias de Pago</Label>
                <Input
                  id="paymentTermDays"
                  name="paymentTermDays"
                  type="number"
                  min="0"
                  defaultValue={order?.paymentTermDays ?? 30}
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={order?.notes || ''}
                  rows={3}
                  disabled={!isDraft}
                />
              </div>
            </div>

            {isDraft && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading
                    ? 'Guardando...'
                    : isEditing
                      ? 'Actualizar'
                      : 'Crear Orden de Compra'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            )}
          </form>

          {/* Workflow action buttons */}
          {isEditing && (
            <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
              {isDraft && order.lines.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSubmitForApproval}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar a Aprobacion
                </Button>
              )}
              {isPending && (
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar OC
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/compras/ordenes-compra')}
              >
                Volver a Lista
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lines Card - only show when editing */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lineas de la Orden de Compra</CardTitle>
              {isDraft && (
                <Button
                  size="sm"
                  onClick={() => setShowNewLine(true)}
                  disabled={showNewLine}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Linea
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Codigo de Costo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">ITBIS</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {canReceive && <TableHead className="text-right">Recibido</TableHead>}
                    {(isDraft || canReceive) && <TableHead className="w-28">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.productName}</TableCell>
                      <TableCell>{line.costCodeName || '-'}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        {line.quantity} {line.productUnit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTaxPercent(line.taxRate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.totalAmount)}
                      </TableCell>
                      {canReceive && (
                        <TableCell className="text-right">
                          {line.quantityReceived} / {line.quantity}
                        </TableCell>
                      )}
                      {isDraft && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={lineLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                      {canReceive && (
                        <TableCell>
                          {receiveLineId === line.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={line.quantity}
                                value={receiveQty}
                                onChange={(e) => setReceiveQty(e.target.value)}
                                className="w-20 h-8 text-right"
                                placeholder="0"
                              />
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => handleReceive(line.id)}
                                disabled={receiveLoading || !receiveQty}
                              >
                                {receiveLoading ? '...' : 'OK'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => {
                                  setReceiveLineId(null)
                                  setReceiveQty('')
                                }}
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setReceiveLineId(line.id)
                                setReceiveQty(line.quantityReceived || '')
                              }}
                              disabled={
                                new Decimal(line.quantityReceived || '0').gte(
                                  new Decimal(line.quantity)
                                )
                              }
                            >
                              <PackageCheck className="mr-1 h-4 w-4" />
                              Recibir
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {/* New line inline form */}
                  {showNewLine && (
                    <TableRow>
                      <TableCell>
                        <EntitySelect
                          value={newLineProductId}
                          onValueChange={setNewLineProductId}
                          options={products}
                          placeholder="Producto..."
                        />
                      </TableCell>
                      <TableCell>
                        <EntitySelect
                          value={newLineCostCodeId}
                          onValueChange={setNewLineCostCodeId}
                          options={costCodes}
                          placeholder="Codigo..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={newLineDescription}
                          onChange={(e) => setNewLineDescription(e.target.value)}
                          placeholder="Descripcion"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newLineQuantity}
                          onChange={(e) => setNewLineQuantity(e.target.value)}
                          placeholder="0"
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newLineUnitPrice}
                          onChange={(e) => setNewLineUnitPrice(e.target.value)}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={newLineTaxRate}
                          onChange={(e) => setNewLineTaxRate(e.target.value)}
                          className="text-right w-20"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {computeNewLineTotal()}
                      </TableCell>
                      {canReceive && <TableCell className="text-right">-</TableCell>}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleAddLine}
                            disabled={
                              lineLoading ||
                              !newLineProductId ||
                              !newLineQuantity ||
                              !newLineUnitPrice
                            }
                          >
                            {lineLoading ? '...' : 'OK'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={resetNewLineForm}
                          >
                            X
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {order.lines.length === 0 && !showNewLine && (
                    <TableRow>
                      <TableCell
                        colSpan={canReceive ? 9 : isDraft ? 8 : 7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay lineas en esta orden de compra.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="space-y-1 text-right">
                <div>
                  <span className="text-sm text-muted-foreground mr-4">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground mr-4">ITBIS:</span>
                  <span className="font-medium">{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="pt-1 border-t">
                  <span className="text-sm text-muted-foreground mr-4">Total:</span>
                  <span className="text-xl font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
