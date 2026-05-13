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
  createBudget,
  updateBudget,
  addBudgetLine,
  removeBudgetLine,
  submitForApproval,
  approveBudget,
  rejectBudget,
} from './_actions'
import { useState } from 'react'
import { Plus, Trash2, Send, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface BudgetLineData {
  id: string
  costCodeId: string
  costCodeName: string
  accountId: string | null
  description: string | null
  quantity: string
  unitCost: string
  budgetedAmount: string
  committedAmount: string
  executedAmount: string
  availableAmount: string
}

interface Props {
  budget?: {
    id: string
    code: string
    name: string
    projectId: string
    status: string
    totalAmount: string
    notes: string | null
    approvedBy: string | null
    lines: BudgetLineData[]
  }
  projects: { value: string; label: string }[]
  costCodes: { value: string; label: string }[]
}

export function BudgetForm({ budget, projects, costCodes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState(budget?.projectId || '')
  const isEditing = !!budget
  const isDraft = !budget || budget.status === 'DRAFT'
  const isPending = budget?.status === 'PENDING_APPROVAL'

  // New line form state
  const [showNewLine, setShowNewLine] = useState(false)
  const [newLineCostCodeId, setNewLineCostCodeId] = useState('')
  const [newLineDescription, setNewLineDescription] = useState('')
  const [newLineQuantity, setNewLineQuantity] = useState('')
  const [newLineUnitCost, setNewLineUnitCost] = useState('')
  const [lineLoading, setLineLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('projectId', projectId)
      if (isEditing) {
        await updateBudget(budget.id, formData)
        router.refresh()
      } else {
        const result = await createBudget(formData)
        router.push(`/presupuesto/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLine = async () => {
    if (!budget) return
    setLineLoading(true)
    setError('')

    try {
      await addBudgetLine(budget.id, {
        costCodeId: newLineCostCodeId,
        description: newLineDescription || null,
        quantity: newLineQuantity,
        unitCost: newLineUnitCost,
      })
      setShowNewLine(false)
      setNewLineCostCodeId('')
      setNewLineDescription('')
      setNewLineQuantity('')
      setNewLineUnitCost('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar linea')
    } finally {
      setLineLoading(false)
    }
  }

  const handleRemoveLine = async (lineId: string) => {
    setLineLoading(true)
    setError('')

    try {
      await removeBudgetLine(lineId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar linea')
    } finally {
      setLineLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!budget) return
    setLoading(true)
    setError('')

    try {
      await submitForApproval(budget.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar a aprobacion')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!budget) return
    setLoading(true)
    setError('')

    try {
      await approveBudget(budget.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!budget) return
    setLoading(true)
    setError('')

    try {
      await rejectBudget(budget.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
    } finally {
      setLoading(false)
    }
  }

  const computeNewLineTotal = (): string => {
    try {
      if (!newLineQuantity || !newLineUnitCost) return formatCurrency('0')
      const total = new Decimal(newLineQuantity).times(new Decimal(newLineUnitCost))
      return formatCurrency(total.toString())
    } catch {
      return formatCurrency('0')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</CardTitle>
            {budget && <StatusBadge status={budget.status} />}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={budget?.code}
                  required
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={budget?.name}
                  required
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={budget?.notes || ''}
                  rows={3}
                  disabled={!isDraft}
                />
              </div>
            </div>

            {isDraft && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Presupuesto'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            )}
          </form>

          {/* Approval action buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t mt-4">
              {isDraft && budget.lines.length > 0 && (
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
              <Button type="button" variant="outline" onClick={() => router.push('/presupuesto')}>
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
              <CardTitle>Lineas del Presupuesto</CardTitle>
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
                    <TableHead>Codigo de Costo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unitario</TableHead>
                    <TableHead className="text-right">Presupuestado</TableHead>
                    <TableHead className="text-right">Comprometido</TableHead>
                    <TableHead className="text-right">Ejecutado</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.costCodeName}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.budgetedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.committedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.executedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.availableAmount)}
                      </TableCell>
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
                          value={newLineUnitCost}
                          onChange={(e) => setNewLineUnitCost(e.target.value)}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {computeNewLineTotal()}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleAddLine}
                            disabled={lineLoading || !newLineCostCodeId || !newLineQuantity || !newLineUnitCost}
                          >
                            {lineLoading ? '...' : 'OK'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowNewLine(false)
                              setNewLineCostCodeId('')
                              setNewLineDescription('')
                              setNewLineQuantity('')
                              setNewLineUnitCost('')
                            }}
                          >
                            X
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {budget.lines.length === 0 && !showNewLine && (
                    <TableRow>
                      <TableCell
                        colSpan={isDraft ? 9 : 8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay lineas en este presupuesto.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-4">Total Presupuestado:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(budget.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
