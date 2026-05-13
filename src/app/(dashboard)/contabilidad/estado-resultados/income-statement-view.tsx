'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { getIncomeStatement } from './_actions'
import Decimal from 'decimal.js'

interface StatementAccount {
  id: string
  code: string
  name: string
  type: string
  balance: string
}

interface StatementData {
  income: StatementAccount[]
  costs: StatementAccount[]
  expenses: StatementAccount[]
  totalIncome: string
  totalCosts: string
  totalExpenses: string
  netResult: string
}

function SectionTable({ title, accounts, total }: {
  title: string
  accounts: StatementAccount[]
  total: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground h-12">
                    Sin cuentas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">Total {title}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function IncomeStatementView() {
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [data, setData] = useState<StatementData | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!startDate || !endDate) return
    startTransition(async () => {
      const result = await getIncomeStatement(startDate, endDate)
      setData(result)
    })
  }

  const isProfit = data ? new Decimal(data.netResult).gte(0) : true

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={handleSearch} disabled={!startDate || !endDate || isPending}>
                {isPending ? 'Cargando...' : 'Consultar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <SectionTable title="Ingresos" accounts={data.income} total={data.totalIncome} />
          <SectionTable title="Costos" accounts={data.costs} total={data.totalCosts} />
          <SectionTable title="Gastos" accounts={data.expenses} total={data.totalExpenses} />

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Resultado del Periodo</p>
                <p className={`text-3xl font-bold ${isProfit ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(data.netResult)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isProfit ? 'Utilidad Neta' : 'Perdida Neta'}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Ingresos</p>
                  <p className="font-medium">{formatCurrency(data.totalIncome)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costos</p>
                  <p className="font-medium">{formatCurrency(data.totalCosts)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gastos</p>
                  <p className="font-medium">{formatCurrency(data.totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
