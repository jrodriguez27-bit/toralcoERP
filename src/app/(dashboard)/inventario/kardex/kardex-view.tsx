'use client'

import { useState, useTransition } from 'react'
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
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getKardexByProduct } from './_actions'
import Decimal from 'decimal.js'

interface KardexEntry {
  id: string
  date: string
  type: string
  reference: string | null
  entryQty: string
  entryUnitCost: string
  entryTotal: string
  exitQty: string
  exitUnitCost: string
  exitTotal: string
  balanceQty: string
  balanceUnitCost: string
  balanceTotal: string
}

const TYPE_LABELS: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT_IN: 'Ajuste Entrada',
  ADJUSTMENT_OUT: 'Ajuste Salida',
  TRANSFER_IN: 'Transferencia Entrada',
  TRANSFER_OUT: 'Transferencia Salida',
  CONSUMPTION: 'Consumo',
  PURCHASE_ORDER: 'Orden de Compra',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferencia',
}

interface Props {
  products: { value: string; label: string }[]
}

export function KardexView({ products }: Props) {
  const [productId, setProductId] = useState('')
  const [entries, setEntries] = useState<KardexEntry[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleProductChange = (id: string) => {
    setProductId(id)
    setError('')
    if (!id) {
      setEntries([])
      return
    }

    startTransition(async () => {
      try {
        const data = await getKardexByProduct(id)
        setEntries(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar kardex')
        setEntries([])
      }
    })
  }

  const formatQty = (val: string): string => {
    const d = new Decimal(val)
    return d.isZero() ? '-' : d.toFixed(2)
  }

  const formatMoney = (val: string): string => {
    const d = new Decimal(val)
    return d.isZero() ? '-' : formatCurrency(val)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta de Kardex</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="max-w-md">
            <Label>Seleccionar Producto</Label>
            <EntitySelect
              value={productId}
              onValueChange={handleProductChange}
              options={products}
              placeholder="Seleccionar producto..."
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {isPending && (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          )}

          {!isPending && productId && entries.length === 0 && !error && (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos en el kardex para este producto.
            </div>
          )}

          {!isPending && entries.length > 0 && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="border-r align-bottom">Fecha</TableHead>
                    <TableHead rowSpan={2} className="border-r align-bottom">Tipo</TableHead>
                    <TableHead rowSpan={2} className="border-r align-bottom">Referencia</TableHead>
                    <TableHead colSpan={3} className="text-center border-r border-b">Entrada</TableHead>
                    <TableHead colSpan={3} className="text-center border-r border-b">Salida</TableHead>
                    <TableHead colSpan={3} className="text-center border-b">Saldo</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">C. Unit.</TableHead>
                    <TableHead className="text-right border-r">Total</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">C. Unit.</TableHead>
                    <TableHead className="text-right border-r">Total</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">C. Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="border-r whitespace-nowrap">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        {TYPE_LABELS[entry.type] || entry.type}
                      </TableCell>
                      <TableCell className="border-r">
                        {entry.reference || '-'}
                      </TableCell>
                      {/* Entry */}
                      <TableCell className="text-right tabular-nums">
                        {formatQty(entry.entryQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(entry.entryUnitCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums border-r">
                        {formatMoney(entry.entryTotal)}
                      </TableCell>
                      {/* Exit */}
                      <TableCell className="text-right tabular-nums">
                        {formatQty(entry.exitQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(entry.exitUnitCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums border-r">
                        {formatMoney(entry.exitTotal)}
                      </TableCell>
                      {/* Balance */}
                      <TableCell className="text-right tabular-nums font-medium">
                        {new Decimal(entry.balanceQty).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(entry.balanceUnitCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(entry.balanceTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isPending && entries.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {entries.length} registro(s) en el kardex
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
