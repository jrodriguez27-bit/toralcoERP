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
import { getBalanceSheet } from './_actions'
import Decimal from 'decimal.js'

interface BalanceSheetAccount {
  id: string
  code: string
  name: string
  type: string
  balance: string
}

interface BalanceSheetData {
  assets: BalanceSheetAccount[]
  liabilities: BalanceSheetAccount[]
  equity: BalanceSheetAccount[]
  totalAssets: string
  totalLiabilities: string
  totalEquity: string
}

function SectionTable({ title, accounts, total }: {
  title: string
  accounts: BalanceSheetAccount[]
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
                <TableHead className="text-right">Balance</TableHead>
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

export function BalanceSheetView() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!asOfDate) return
    startTransition(async () => {
      const result = await getBalanceSheet(asOfDate)
      setData(result)
    })
  }

  const pasivoPlusPatrimonio = data
    ? new Decimal(data.totalLiabilities).plus(data.totalEquity).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Fecha de Corte</Label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={handleSearch} disabled={!asOfDate || isPending}>
                {isPending ? 'Cargando...' : 'Consultar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <SectionTable title="Activos" accounts={data.assets} total={data.totalAssets} />
          <SectionTable title="Pasivos" accounts={data.liabilities} total={data.totalLiabilities} />
          <SectionTable title="Patrimonio" accounts={data.equity} total={data.totalEquity} />

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Activos</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totalAssets)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Pasivos + Patrimonio</p>
                  <p className="text-2xl font-bold">{formatCurrency(pasivoPlusPatrimonio)}</p>
                </div>
              </div>
              {!new Decimal(data.totalAssets).equals(new Decimal(pasivoPlusPatrimonio)) && (
                <p className="text-destructive text-center mt-4 font-medium">
                  El balance no cuadra. Diferencia: {formatCurrency(
                    new Decimal(data.totalAssets).minus(pasivoPlusPatrimonio).abs().toFixed(2)
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
