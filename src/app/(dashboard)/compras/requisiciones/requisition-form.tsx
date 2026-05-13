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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EntitySelect } from '@/components/shared/entity-select'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  createRequisition,
  updateRequisition,
  addRequisitionLine,
  removeRequisitionLine,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  checkLineBudget,
  convertToOC,
} from './_actions'
import { useState } from 'react'
import { Plus, Trash2, Send, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface RequisitionLineData {
  id: string
  productId: string
  productName: string
  productUnit: string
  costCodeId: string | null
  costCodeName: string | null
  description: string | null
  quantity: string
  estimatedCost: string
  convertedQty: string
}

interface Props {
  requisition?: {
    id: string
    number: string
    projectId: string
    description: string | null
    status: string
    notes: string | null
    requestedBy: string
    approvedBy: string | null
    lines: RequisitionLineData[]
  }
  projects: { value: string; label: string }[]
  products: { value: string; label: string; unit?: string }[]
  costCodes: { value: string; label: string }[]
  suppliers?: { value: string; label: string }[]
}

type BudgetStatus = 'green' | 'yellow' | 'red' | null

export function RequisitionForm({ requisition, projects, products, costCodes, suppliers }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState(requisition?.projectId || '')
  const isEditing = !!requisition
  const isDraft = !requisition || requisition.status === 'DRAFT'
  const isPending = requisition?.status === 'PENDING_APPROVAL'
  const isApproved = requisition?.status === 'APPROVED'
  const isPartiallyConverted = requisition?.status === 'PARTIALLY_CONVERTED'
  const canConvert = isApproved || isPartiallyConverted

  // New line form state
  const [showNewLine, setShowNewLine] = useState(false)
  const [newLineProductId, setNewLineProductId] = useState('')
  const [newLineCostCodeId, setNewLineCostCodeId] = useState('')
  const [newLineDescription, setNewLineDescription] = useState('')
  const [newLineQuantity, setNewLineQuantity] = useState('')
  const [newLineEstimatedCost, setNewLineEstimatedCost] = useState('')
  const [newLineBudgetStatus, setNewLineBudgetStatus] = useState<BudgetStatus>(null)
  const [lineLoading, setLineLoading] = useState(false)

  // Convert dialog state
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertSupplierId, setConvertSupplierId] = useState('')
  const [convertLoading, setConvertLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('projectId', projectId)
      if (isEditing) {
        await updateRequisition(requisition.id, formData)
        router.refresh()
      } else {
        const result = await createRequisition(formData)
        router.push(`/compras/requisiciones/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckBudget = async () => {
    if (!projectId || !newLineCostCodeId || !newLineQuantity || !newLineEstimatedCost) {
      setNewLineBudgetStatus(null)
      return
    }
    try {
      const totalEstimated = new Decimal(newLineQuantity).times(new Decimal(newLineEstimatedCost))
      const result = await checkLineBudget(projectId, newLineCostCodeId, totalEstimated.toString())
      setNewLineBudgetStatus(result.status)
    } catch {
      setNewLineBudgetStatus(null)
    }
  }

  const handleAddLine = async () => {
    if (!requisition) return
    setLineLoading(true)
    setError('')

    try {
      const result = await addRequisitionLine(requisition.id, {
        productId: newLineProductId,
        costCodeId: newLineCostCodeId || null,
        description: newLineDescription || null,
        quantity: newLineQuantity,
        estimatedCost: newLineEstimatedCost || '0',
      })
      if (result.budgetCheck) {
        // Line was added, budget status was checked
      }
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
    setNewLineEstimatedCost('')
    setNewLineBudgetStatus(null)
  }

  const handleRemoveLine = async (lineId: string) => {
    setLineLoading(true)
    setError('')

    try {
      await removeRequisitionLine(lineId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar linea')
    } finally {
      setLineLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!requisition) return
    setLoading(true)
    setError('')

    try {
      await submitRequisition(requisition.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar a aprobacion')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!requisition) return
    setLoading(true)
    setError('')

    try {
      await approveRequisition(requisition.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!requisition) return
    setLoading(true)
    setError('')

    try {
      await rejectRequisition(requisition.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!requisition || !convertSupplierId) return
    setConvertLoading(true)
    setError('')

    try {
      const result = await convertToOC(requisition.id, convertSupplierId)
      setShowConvertDialog(false)
      router.push(`/compras/ordenes-compra/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir a OC')
      setConvertLoading(false)
    }
  }

  const computeLineTotal = (quantity: string, estimatedCost: string): string => {
    try {
      if (!quantity || !estimatedCost) return formatCurrency('0')
      const total = new Decimal(quantity).times(new Decimal(estimatedCost))
      return formatCurrency(total.toString())
    } catch {
      return formatCurrency('0')
    }
  }

  const computeGrandTotal = (): string => {
    if (!requisition) return formatCurrency('0')
    try {
      const total = requisition.lines.reduce((acc, line) => {
        return acc.plus(new Decimal(line.quantity).times(new Decimal(line.estimatedCost)))
      }, new Decimal(0))
      return formatCurrency(total.toString())
    } catch {
      return formatCurrency('0')
    }
  }

  const getBudgetDot = (status: BudgetStatus) => {
    if (!status) return null
    const colors = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    }
    return (
      <span
        className={`inline-block h-3 w-3 rounded-full ${colors[status]}`}
        title={
          status === 'green'
            ? 'Presupuesto disponible'
            : status === 'yellow'
              ? 'Presupuesto limitado'
              : 'Sin presupuesto disponible'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {isEditing ? `Requisicion ${requisition.number}` : 'Nueva Requisicion'}
            </CardTitle>
            {requisition && <StatusBadge status={requisition.status} />}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={requisition?.description || ''}
                  disabled={!isDraft}
                  placeholder="Descripcion breve de la requisicion"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={requisition?.notes || ''}
                  rows={3}
                  disabled={!isDraft}
                />
              </div>
            </div>

            {isDraft && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Requisicion'}
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
              {isDraft && requisition.lines.length > 0 && (
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
                <>
                  <Button
                    variant="default"
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </>
              )}
              {canConvert && suppliers && suppliers.length > 0 && (
                <Button
                  variant="default"
                  onClick={() => setShowConvertDialog(true)}
                  disabled={loading}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convertir a OC
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/compras/requisiciones')}
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
              <CardTitle>Lineas de la Requisicion</CardTitle>
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
                    <TableHead className="text-right">Costo Estimado</TableHead>
                    <TableHead className="text-right">Total Estimado</TableHead>
                    {canConvert && <TableHead className="text-right">Convertido</TableHead>}
                    {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisition.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.productName}</TableCell>
                      <TableCell>{line.costCodeName || '-'}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        {line.quantity} {line.productUnit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.estimatedCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {computeLineTotal(line.quantity, line.estimatedCost)}
                      </TableCell>
                      {canConvert && (
                        <TableCell className="text-right">{line.convertedQty}</TableCell>
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
                          onValueChange={(v) => {
                            setNewLineCostCodeId(v)
                            // Trigger budget check after state update
                            setTimeout(() => handleCheckBudget(), 100)
                          }}
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
                          onChange={(e) => {
                            setNewLineQuantity(e.target.value)
                            setTimeout(() => handleCheckBudget(), 100)
                          }}
                          placeholder="0"
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newLineEstimatedCost}
                            onChange={(e) => {
                              setNewLineEstimatedCost(e.target.value)
                              setTimeout(() => handleCheckBudget(), 100)
                            }}
                            placeholder="0.00"
                            className="text-right"
                          />
                          {getBudgetDot(newLineBudgetStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {computeLineTotal(newLineQuantity, newLineEstimatedCost)}
                      </TableCell>
                      {canConvert && <TableCell className="text-right">-</TableCell>}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleAddLine}
                            disabled={lineLoading || !newLineProductId || !newLineQuantity}
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

                  {requisition.lines.length === 0 && !showNewLine && (
                    <TableRow>
                      <TableCell
                        colSpan={isDraft ? 7 : canConvert ? 7 : 6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay lineas en esta requisicion.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-4">Total Estimado:</span>
                <span className="text-xl font-bold">{computeGrandTotal()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Convert to OC Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir a Orden de Compra</DialogTitle>
            <DialogDescription>
              Seleccione el proveedor para crear la orden de compra a partir de esta requisicion.
              Se copiaran las lineas no convertidas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <EntitySelect
                value={convertSupplierId}
                onValueChange={setConvertSupplierId}
                options={suppliers || []}
                placeholder="Seleccionar proveedor..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertLoading || !convertSupplierId}
            >
              {convertLoading ? 'Creando OC...' : 'Crear Orden de Compra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
