'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency } from '@/lib/utils'
import {
  calculatePayrollRun,
  approvePayrollRun,
  postPayrollRun,
  deletePayrollRun,
  updatePayrollDetail,
} from '../_actions'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Calculator, CheckCircle, BookOpen, Trash2, Pencil, X, Save, Loader2,
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
}

interface DetailRow {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  baseSalary: string
  overtimeHours: string
  overtimeAmount: string
  bonuses: string
  grossPay: string
  afpEmployee: string
  sfsEmployee: string
  isrAmount: string
  otherDeductions: string
  totalDeductions: string
  netPay: string
  afpEmployer: string
  sfsEmployer: string
  srlEmployer: string
  infotepEmployer: string
  totalEmployerCost: string
}

interface PayrollRunData {
  id: string
  number: string
  periodStart: string
  periodEnd: string
  type: string
  status: string
  totalGross: string
  totalDeductions: string
  totalNet: string
  totalEmployerCost: string
  notes: string | null
  journalEntryId: string | null
  details: DetailRow[]
}

interface PayrollRunDetailProps {
  run: PayrollRunData
}

export function PayrollRunDetail({ run }: PayrollRunDetailProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ overtimeHours: '0', bonuses: '0', otherDeductions: '0' })
  const router = useRouter()

  const handleAction = (action: string) => {
    setConfirmAction(null)
    startTransition(async () => {
      switch (action) {
        case 'calculate':
          await calculatePayrollRun(run.id)
          break
        case 'approve':
          await approvePayrollRun(run.id)
          break
        case 'post':
          await postPayrollRun(run.id)
          break
        case 'delete':
          await deletePayrollRun(run.id)
          break
      }
      router.refresh()
    })
  }

  const handleEditStart = (detail: DetailRow) => {
    setEditingId(detail.id)
    setEditForm({
      overtimeHours: detail.overtimeHours,
      bonuses: detail.bonuses,
      otherDeductions: detail.otherDeductions,
    })
  }

  const handleEditSave = () => {
    if (!editingId) return
    startTransition(async () => {
      await updatePayrollDetail(editingId, editForm)
      setEditingId(null)
      router.refresh()
    })
  }

  const actionConfig: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
    calculate: {
      label: 'Calcular Nómina',
      description: 'Se calculará la nómina para todos los empleados activos. ¿Desea continuar?',
      icon: <Calculator className="mr-2 h-4 w-4" />,
    },
    approve: {
      label: 'Aprobar Nómina',
      description: 'Una vez aprobada, no se podrán modificar los detalles. ¿Desea aprobar?',
      icon: <CheckCircle className="mr-2 h-4 w-4" />,
    },
    post: {
      label: 'Contabilizar',
      description: 'Se creará el asiento contable correspondiente. ¿Desea contabilizar?',
      icon: <BookOpen className="mr-2 h-4 w-4" />,
    },
    delete: {
      label: 'Eliminar',
      description: 'Se eliminará la corrida y todos sus detalles. ¿Está seguro?',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
    },
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Estado</div>
            <div className="mt-1"><StatusBadge status={run.status} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Bruto</div>
            <div className="text-xl font-bold mt-1">{formatCurrency(run.totalGross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Deducciones</div>
            <div className="text-xl font-bold mt-1 text-red-600">{formatCurrency(run.totalDeductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Neto</div>
            <div className="text-xl font-bold mt-1 text-green-600">{formatCurrency(run.totalNet)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Costo Patronal</div>
            <div className="text-xl font-bold mt-1">{formatCurrency(run.totalEmployerCost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info + Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información de la Corrida</CardTitle>
            <div className="flex items-center gap-2">
              {run.status === 'DRAFT' && (
                <>
                  <Button onClick={() => setConfirmAction('calculate')} disabled={isPending}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular
                  </Button>
                  <Button variant="destructive" onClick={() => setConfirmAction('delete')} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              )}
              {run.status === 'CALCULATED' && (
                <Button onClick={() => setConfirmAction('approve')} disabled={isPending}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              )}
              {run.status === 'APPROVED' && (
                <Button onClick={() => setConfirmAction('post')} disabled={isPending}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Contabilizar
                </Button>
              )}
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span>{' '}
              <span className="font-medium">{TYPE_LABELS[run.type] || run.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Empleados:</span>{' '}
              <span className="font-medium">{run.details.length}</span>
            </div>
            {run.journalEntryId && (
              <div>
                <span className="text-muted-foreground">Asiento:</span>{' '}
                <Badge variant="outline">Vinculado</Badge>
              </div>
            )}
            {run.notes && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-muted-foreground">Notas:</span>{' '}
                <span>{run.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      {run.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                    <TableHead className="text-right">H. Extra</TableHead>
                    <TableHead className="text-right">Bonos</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">AFP</TableHead>
                    <TableHead className="text-right">SFS</TableHead>
                    <TableHead className="text-right">ISR</TableHead>
                    <TableHead className="text-right">Otras Ded.</TableHead>
                    <TableHead className="text-right">Total Ded.</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    {run.status === 'CALCULATED' && <TableHead className="text-center">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.details.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{detail.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{detail.employeeCode}</div>
                      </TableCell>
                      {editingId === detail.id ? (
                        <>
                          <TableCell className="text-right">{formatCurrency(detail.baseSalary)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              className="w-20 text-right"
                              value={editForm.overtimeHours}
                              onChange={(e) => setEditForm({ ...editForm, overtimeHours: e.target.value })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-24 text-right"
                              value={editForm.bonuses}
                              onChange={(e) => setEditForm({ ...editForm, bonuses: e.target.value })}
                            />
                          </TableCell>
                          <TableCell colSpan={5} className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-24 text-right"
                              value={editForm.otherDeductions}
                              onChange={(e) => setEditForm({ ...editForm, otherDeductions: e.target.value })}
                              placeholder="Otras ded."
                            />
                          </TableCell>
                          <TableCell colSpan={2} />
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditSave} disabled={isPending}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right">{formatCurrency(detail.baseSalary)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.overtimeAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.bonuses)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(detail.grossPay)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.afpEmployee)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.sfsEmployee)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.isrAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(detail.otherDeductions)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(detail.totalDeductions)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{formatCurrency(detail.netPay)}</TableCell>
                          {run.status === 'CALCULATED' && (
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStart(detail)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={actionConfig[confirmAction]?.label ?? 'Confirmar'}
          description={actionConfig[confirmAction]?.description ?? '¿Está seguro?'}
          confirmLabel={actionConfig[confirmAction]?.label ?? 'Confirmar'}
          onConfirm={() => handleAction(confirmAction)}
          variant={confirmAction === 'delete' ? 'destructive' : 'default'}
        />
      )}
    </div>
  )
}
