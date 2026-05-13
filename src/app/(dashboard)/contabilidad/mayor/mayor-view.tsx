'use client'

import { useState, useTransition } from 'react'
import { EntitySelect } from '@/components/shared/entity-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getLedgerEntries } from './_actions'
import Decimal from 'decimal.js'

interface AccountOption {
  value: string
  label: string
}

interface LedgerLine {
  id: string
  entryId: string
  entryNumber: string
  date: string
  description: string
  debit: string
  credit: string
}

interface LedgerData {
  account: {
    id: string
    code: string
    name: string
    type: string
    nature: string
  }
  openingDebit: string
  openingCredit: string
  lines: LedgerLine[]
}

export function MayorView({ accounts }: { accounts: AccountOption[] }) {
  const [accountId, setAccountId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<LedgerData | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!accountId) return
    startTransition(async () => {
      const result = await getLedgerEntries(
        accountId,
        startDate || undefined,
        endDate || undefined
      )
      setData(result)
    })
  }

  // Calculate running balance
  const getRunningBalances = () => {
    if (!data) return []

    const isDebitNature = data.account.nature === 'DEBIT'
    let balance = isDebitNature
      ? new Decimal(data.openingDebit).minus(data.openingCredit)
      : new Decimal(data.openingCredit).minus(data.openingDebit)

    return data.lines.map((line) => {
      const debit = new Decimal(line.debit)
      const credit = new Decimal(line.credit)
      if (isDebitNature) {
        balance = balance.plus(debit).minus(credit)
      } else {
        balance = balance.plus(credit).minus(debit)
      }
      return { ...line, balance: balance.toFixed(2) }
    })
  }

  const linesWithBalance = getRunningBalances()

  const openingBalance = data
    ? data.account.nature === 'DEBIT'
      ? new Decimal(data.openingDebit).minus(data.openingCredit).toFixed(2)
      : new Decimal(data.openingCredit).minus(data.openingDebit).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Cuenta</Label>
              <EntitySelect
                value={accountId}
                onValueChange={setAccountId}
                placeholder="Seleccionar cuenta..."
                options={accounts}
              />
            </div>
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
          </div>
          <div className="mt-4">
            <Button onClick={handleSearch} disabled={!accountId || isPending}>
              {isPending ? 'Cargando...' : 'Consultar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>
              {data.account.code} - {data.account.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tipo: {data.account.type} | Naturaleza: {data.account.nature === 'DEBIT' ? 'Deudora' : 'Acreedora'}
              {startDate && ` | Saldo Inicial: ${formatCurrency(openingBalance)}`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>No. Asiento</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Debito</TableHead>
                    <TableHead className="text-right">Credito</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {startDate && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={3} className="font-medium">
                        Saldo Inicial
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.openingDebit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.openingCredit)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(openingBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                  {linesWithBalance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No se encontraron movimientos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    linesWithBalance.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{formatDate(line.date)}</TableCell>
                        <TableCell>{line.entryNumber}</TableCell>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.credit)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(line.balance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
