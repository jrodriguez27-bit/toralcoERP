'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { runDepreciation } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Play, ChevronDown, ChevronRight } from 'lucide-react'

interface RunEntry {
  id: string
  assetCode: string
  assetName: string
  amount: string
}

interface Run {
  id: string
  period: string
  runDate: string
  totalAmount: string
  entryCount: number
  entries: RunEntry[]
}

interface Props {
  runs: Run[]
}

export function DepreciationView({ runs }: Props) {
  const router = useRouter()
  const [period, setPeriod] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const handleRun = async () => {
    if (!period) return
    setLoading(true)
    setError('')

    try {
      await runDepreciation(period)
      setPeriod('')
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar depreciacion')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Run New Depreciation */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Depreciacion</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">{error}</div>
          )}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Periodo (YYYY-MM)</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2024-06"
                className="w-48"
              />
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!period || loading}
            >
              <Play className="mr-2 h-4 w-4" />
              {loading ? 'Ejecutando...' : 'Ejecutar Depreciacion'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Corridas Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Fecha Corrida</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="text-center">Activos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <>
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpandedRun(expandedRun === run.id ? null : run.id)
                      }
                    >
                      <TableCell>
                        {expandedRun === run.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{run.period}</TableCell>
                      <TableCell>{formatDate(run.runDate)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(run.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">{run.entryCount}</TableCell>
                    </TableRow>
                    {expandedRun === run.id && (
                      <TableRow key={`${run.id}-detail`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Codigo</TableHead>
                                <TableHead>Activo</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {run.entries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium">{entry.assetCode}</TableCell>
                                  <TableCell>{entry.assetName}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(entry.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {runs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hay corridas de depreciacion registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Depreciacion"
        description={`Se ejecutara la depreciacion para el periodo ${period}. Esta accion calculara la depreciacion de todos los activos activos y creara el asiento contable correspondiente.`}
        confirmLabel="Ejecutar"
        onConfirm={handleRun}
      />
    </div>
  )
}
