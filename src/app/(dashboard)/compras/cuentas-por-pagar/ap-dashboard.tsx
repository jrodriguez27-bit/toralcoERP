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
import { formatCurrency, formatDate } from '@/lib/utils'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface APInvoice {
  id: string
  number: string
  supplierName: string
  invoiceDate: string
  dueDate: string
  totalAmount: string
  balanceDue: string
  status: string
  agingDays: number
  bucket: string
}

interface Buckets {
  current: string
  '1-30': string
  '31-60': string
  '61-90': string
  '90+': string
  total: string
}

interface Props {
  invoices: APInvoice[]
  buckets: Buckets
}

const BUCKET_LABELS: Record<string, string> = {
  current: 'Corriente',
  '1-30': '1-30 dias',
  '31-60': '31-60 dias',
  '61-90': '61-90 dias',
  '90+': '90+ dias',
}

const BUCKET_COLORS: Record<string, string> = {
  current: 'bg-green-50 border-green-200',
  '1-30': 'bg-yellow-50 border-yellow-200',
  '31-60': 'bg-orange-50 border-orange-200',
  '61-90': 'bg-red-50 border-red-200',
  '90+': 'bg-red-100 border-red-300',
}

const BUCKET_TEXT_COLORS: Record<string, string> = {
  current: 'text-green-700',
  '1-30': 'text-yellow-700',
  '31-60': 'text-orange-700',
  '61-90': 'text-red-700',
  '90+': 'text-red-800',
}

export function APDashboard({ invoices, buckets }: Props) {
  const [filterBucket, setFilterBucket] = useState<string | null>(null)

  const filteredInvoices = filterBucket
    ? invoices.filter((inv) => inv.bucket === filterBucket)
    : invoices

  const bucketKeys: (keyof Buckets)[] = ['current', '1-30', '31-60', '61-90', '90+']

  const getAgingLabel = (days: number): string => {
    if (days < 0) return `${Math.abs(days)} dias para vencer`
    if (days === 0) return 'Vence hoy'
    return `${days} dias vencido`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {bucketKeys.map((key) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              filterBucket === key ? 'ring-2 ring-primary' : ''
            } ${BUCKET_COLORS[key] || ''}`}
            onClick={() => setFilterBucket(filterBucket === key ? null : key)}
          >
            <CardContent className="p-4">
              <p className={`text-xs font-medium ${BUCKET_TEXT_COLORS[key] || ''}`}>
                {BUCKET_LABELS[key]}
              </p>
              <p className="text-lg font-bold mt-1">
                {formatCurrency(buckets[key])}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Total Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-blue-700">Total CxP</p>
            <p className="text-lg font-bold mt-1 text-blue-900">
              {formatCurrency(buckets.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {filterBucket && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Mostrando: <strong>{BUCKET_LABELS[filterBucket]}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterBucket(null)}
          >
            Ver todas
          </Button>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Facturas Pendientes ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha Factura</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Antigüedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-16">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.number}</TableCell>
                    <TableCell>{inv.supplierName}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(inv.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${
                          inv.agingDays > 60
                            ? 'text-red-600'
                            : inv.agingDays > 30
                              ? 'text-orange-600'
                              : inv.agingDays > 0
                                ? 'text-yellow-600'
                                : 'text-green-600'
                        }`}
                      >
                        {getAgingLabel(inv.agingDays)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/compras/facturas-proveedor/${inv.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {filterBucket
                        ? 'No hay facturas en este periodo de antigüedad.'
                        : 'No hay facturas pendientes de pago.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
