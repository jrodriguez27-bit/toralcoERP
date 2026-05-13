'use client'

import { Fragment, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { getTrialBalance } from './_actions'
import Decimal from 'decimal.js'

interface PeriodOption {
  value: string
  label: string
  year: number
  month: number
  isClosed: boolean
}

interface TrialRow {
  id: string
  code: string
  name: string
  type: string
  debit: string
  credit: string
}

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Activos',
  LIABILITY: 'Pasivos',
  EQUITY: 'Patrimonio',
  INCOME: 'Ingresos',
  EXPENSE: 'Gastos',
  COST: 'Costos',
}

const TYPE_ORDER = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'COST', 'EXPENSE']

export function TrialBalanceView({ periods }: { periods: PeriodOption[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [data, setData] = useState<TrialRow[]>([])
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!selectedPeriod) return
    const period = periods.find((p) => p.value === selectedPeriod)
    if (!period) return
    startTransition(async () => {
      const result = await getTrialBalance(period.year, period.month)
      setData(result)
    })
  }

  // Group by type
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type] || type,
    rows: data.filter((r) => r.type === type),
  })).filter((g) => g.rows.length > 0)

  const totalDebit = data.reduce((sum, r) => sum.plus(r.debit), new Decimal(0))
  const totalCredit = data.reduce((sum, r) => sum.plus(r.credit), new Decimal(0))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Periodo</Label>
              <EntitySelect
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
                placeholder="Seleccionar periodo..."
                options={periods}
              />
            </div>
            <div>
              <Button onClick={handleSearch} disabled={!selectedPeriod || isPending}>
                {isPending ? 'Cargando...' : 'Consultar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Balance de Comprobacion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right">Debito</TableHead>
                    <TableHead className="text-right">Credito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((group) => {
                    const groupDebit = group.rows.reduce(
                      (sum, r) => sum.plus(r.debit),
                      new Decimal(0)
                    )
                    const groupCredit = group.rows.reduce(
                      (sum, r) => sum.plus(r.credit),
                      new Decimal(0)
                    )
                    return (
                      <Fragment key={group.type}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="font-bold">
                            {group.label}
                          </TableCell>
                        </TableRow>
                        {group.rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.debit)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.credit)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={2} className="text-right font-medium">
                            Subtotal {group.label}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(groupDebit.toFixed(2))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(groupCredit.toFixed(2))}
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      TOTALES
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalDebit.toFixed(2))}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalCredit.toFixed(2))}
                    </TableCell>
                  </TableRow>
                  {!totalDebit.equals(totalCredit) && (
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold text-destructive">
                        DIFERENCIA
                      </TableCell>
                      <TableCell colSpan={2} className="text-right font-bold text-destructive">
                        {formatCurrency(totalDebit.minus(totalCredit).abs().toFixed(2))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

