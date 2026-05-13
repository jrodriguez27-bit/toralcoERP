'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Search, AlertTriangle } from 'lucide-react'
import Decimal from 'decimal.js'

interface StockRow {
  id: string
  code: string
  name: string
  unit: string
  minStock: string
  warehouses: Record<string, string>
  total: number
}

interface WarehouseInfo {
  id: string
  code: string
  name: string
}

interface Props {
  data: StockRow[]
  warehouses: WarehouseInfo[]
}

export function StockMatrix({ data, warehouses }: Props) {
  const [search, setSearch] = useState('')

  const filtered = data.filter(
    (row) =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.code.toLowerCase().includes(search.toLowerCase())
  )

  const isLowStock = (row: StockRow): boolean => {
    const min = new Decimal(row.minStock)
    if (min.lte(0)) return false
    // Check if any warehouse has qty below minStock, or total is below
    return new Decimal(row.total).lt(min)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Producto</TableHead>
                  <TableHead className="w-20">Unidad</TableHead>
                  {warehouses.map((w) => (
                    <TableHead key={w.id} className="text-right min-w-[100px]">
                      {w.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-right min-w-[100px] font-bold">
                    Total
                  </TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={warehouses.length + 4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No se encontraron productos con stock.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const low = isLowStock(row)
                    return (
                      <TableRow key={row.id} className={low ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{row.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {row.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.unit}
                        </TableCell>
                        {warehouses.map((w) => {
                          const qty = row.warehouses[w.id]
                          return (
                            <TableCell key={w.id} className="text-right tabular-nums">
                              {qty ? new Decimal(qty).toFixed(2) : '-'}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right font-bold tabular-nums">
                          {new Decimal(row.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {low && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Bajo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filtered.length} producto(s) con stock
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
