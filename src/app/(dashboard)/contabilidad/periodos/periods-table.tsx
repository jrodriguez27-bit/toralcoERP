'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { createPeriod, closePeriod, reopenPeriod } from './_actions'
import { formatDate } from '@/lib/utils'
import { Lock, Unlock, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Period {
  id: string
  name: string
  year: number
  month: number
  startDate: string
  endDate: string
  isClosed: boolean
  closedAt: string | null
  entryCount: number
  createdAt: string
}

interface Props {
  data: Period[]
  currentPeriodExists: boolean
  currentYear: number
  currentMonth: number
}

export function PeriodsTable({ data, currentPeriodExists, currentYear, currentMonth }: Props) {
  const [closeId, setCloseId] = useState<string | null>(null)
  const [reopenId, setReopenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateCurrent = async () => {
    setLoading(true)
    setError('')
    try {
      await createPeriod({ year: currentYear, month: currentMonth })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear periodo')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!closeId) return
    setLoading(true)
    setError('')
    try {
      await closePeriod(closeId)
      setCloseId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar periodo')
    } finally {
      setLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!reopenId) return
    setLoading(true)
    setError('')
    try {
      await reopenPeriod(reopenId)
      setReopenId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reabrir periodo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {!currentPeriodExists && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">
              No existe un periodo para el mes actual ({currentMonth}/{currentYear}).
            </p>
            <Button onClick={handleCreateCurrent} disabled={loading} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Crear Periodo Actual
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Asientos</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No hay periodos contables registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium capitalize">{period.name}</TableCell>
                      <TableCell>{period.year}</TableCell>
                      <TableCell>{period.month.toString().padStart(2, '0')}</TableCell>
                      <TableCell>{formatDate(period.startDate)}</TableCell>
                      <TableCell>{formatDate(period.endDate)}</TableCell>
                      <TableCell>
                        {period.isClosed ? (
                          <StatusBadge status="CLOSED" />
                        ) : (
                          <StatusBadge status="ACTIVE" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">{period.entryCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!period.isClosed ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setCloseId(period.id)}
                              title="Cerrar periodo"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setReopenId(period.id)}
                              title="Reabrir periodo"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!closeId}
        onOpenChange={() => setCloseId(null)}
        title="Cerrar Periodo"
        description="Al cerrar el periodo, no se podran crear ni modificar asientos contables en este periodo. Los asientos en borrador deben ser contabilizados o eliminados antes de cerrar."
        confirmLabel="Cerrar Periodo"
        variant="destructive"
        onConfirm={handleClose}
      />
      <ConfirmDialog
        open={!!reopenId}
        onOpenChange={() => setReopenId(null)}
        title="Reabrir Periodo"
        description="Al reabrir el periodo, se permitira la creacion y modificacion de asientos contables. Esta accion requiere permisos de administrador."
        confirmLabel="Reabrir"
        onConfirm={handleReopen}
      />
    </>
  )
}
