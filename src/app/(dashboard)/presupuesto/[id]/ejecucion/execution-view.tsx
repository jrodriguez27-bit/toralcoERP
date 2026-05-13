'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Decimal from 'decimal.js'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BudgetLine {
  id: string
  costCodeName: string
  costCodeShort: string
  budgetedAmount: string
  committedAmount: string
  executedAmount: string
  availableAmount: string
}

interface Props {
  budget: {
    id: string
    code: string
    name: string
    status: string
    totalAmount: string
    projectName: string
    lines: BudgetLine[]
  }
}

function getExecutionPercentage(budgetedAmount: string, executedAmount: string): number {
  const budgeted = new Decimal(budgetedAmount)
  if (budgeted.isZero()) return 0
  return new Decimal(executedAmount).div(budgeted).times(100).toDecimalPlaces(1).toNumber()
}

function getTrafficLightColor(availableAmount: string, budgetedAmount: string): string {
  const available = new Decimal(availableAmount)
  const budgeted = new Decimal(budgetedAmount)
  if (budgeted.isZero()) return 'bg-gray-400'

  const ratio = available.div(budgeted).toNumber()
  if (ratio > 0.3) return 'bg-green-500'
  if (ratio > 0.1) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function ExecutionView({ budget }: Props) {
  const chartData = budget.lines.map((line) => ({
    name: line.costCodeShort,
    Presupuestado: new Decimal(line.budgetedAmount).toNumber(),
    Comprometido: new Decimal(line.committedAmount).toNumber(),
    Ejecutado: new Decimal(line.executedAmount).toNumber(),
    Disponible: new Decimal(line.availableAmount).toNumber(),
  }))

  // Calculate totals
  const totalBudgeted = budget.lines.reduce(
    (sum, l) => sum.plus(new Decimal(l.budgetedAmount)),
    new Decimal(0)
  )
  const totalCommitted = budget.lines.reduce(
    (sum, l) => sum.plus(new Decimal(l.committedAmount)),
    new Decimal(0)
  )
  const totalExecuted = budget.lines.reduce(
    (sum, l) => sum.plus(new Decimal(l.executedAmount)),
    new Decimal(0)
  )
  const totalAvailable = budget.lines.reduce(
    (sum, l) => sum.plus(new Decimal(l.availableAmount)),
    new Decimal(0)
  )
  const overallExecution = totalBudgeted.isZero()
    ? 0
    : totalExecuted.div(totalBudgeted).times(100).toDecimalPlaces(1).toNumber()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/presupuesto/${budget.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Ejecucion Presupuestaria
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {budget.code} - {budget.name} | Proyecto: {budget.projectName}
          </p>
        </div>
        <StatusBadge status={budget.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Presupuestado</div>
            <div className="text-xl font-bold">{formatCurrency(totalBudgeted.toString())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Comprometido</div>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(totalCommitted.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Ejecutado</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(totalExecuted.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Disponible</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totalAvailable.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">% Ejecucion</div>
            <div className="text-xl font-bold">{overallExecution}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Codigo de Costo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Estado</TableHead>
                  <TableHead>Codigo de Costo</TableHead>
                  <TableHead className="text-right">Presupuestado</TableHead>
                  <TableHead className="text-right">Comprometido</TableHead>
                  <TableHead className="text-right">Ejecutado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">% Ejecucion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.lines.map((line) => {
                  const pct = getExecutionPercentage(line.budgetedAmount, line.executedAmount)
                  const lightColor = getTrafficLightColor(line.availableAmount, line.budgetedAmount)

                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div
                          className={`h-3 w-3 rounded-full ${lightColor}`}
                          title={`Disponible: ${formatCurrency(line.availableAmount)}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{line.costCodeName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.budgetedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.committedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.executedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.availableAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {budget.lines.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay lineas en este presupuesto.
                    </TableCell>
                  </TableRow>
                )}

                {/* Totals row */}
                {budget.lines.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell />
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalBudgeted.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalCommitted.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalExecuted.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalAvailable.toString())}
                    </TableCell>
                    <TableCell className="text-right">{overallExecution}%</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {budget.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto vs Ejecucion por Codigo de Costo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat('es-DO', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat('es-DO', {
                        style: 'currency',
                        currency: 'DOP',
                      }).format(Number(value))
                    }
                  />
                  <Legend />
                  <Bar dataKey="Presupuestado" fill="#3b82f6" />
                  <Bar dataKey="Comprometido" fill="#8b5cf6" />
                  <Bar dataKey="Ejecutado" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
