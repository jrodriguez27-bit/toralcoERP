'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const ADJUSTMENT_LABELS: Record<string, string> = {
  ADJUSTMENT_IN: 'Ajuste Entrada',
  ADJUSTMENT_OUT: 'Ajuste Salida',
}

const ADJUSTMENT_COLORS: Record<string, string> = {
  ADJUSTMENT_IN: 'bg-green-100 text-green-800',
  ADJUSTMENT_OUT: 'bg-red-100 text-red-800',
}

interface AdjustmentRow {
  id: string
  createdAt: string
  productName: string
  productCode: string
  warehouseName: string
  type: string
  quantity: string
  unitCost: string
  totalCost: string
  notes: string | null
}

interface Props {
  data: AdjustmentRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function AdjustmentsTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: Props) {
  const columns: Column<AdjustmentRow>[] = [
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'productName',
      label: 'Producto',
      render: (row) => (
        <div>
          <span className="font-medium">{row.productName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.productCode}</span>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      label: 'Almacen',
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row) => (
        <Badge className={ADJUSTMENT_COLORS[row.type] || 'bg-gray-100 text-gray-800'}>
          {ADJUSTMENT_LABELS[row.type] || row.type}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      className: 'text-right',
      render: (row) => (
        <span className="tabular-nums">{Number(row.quantity).toFixed(2)}</span>
      ),
    },
    {
      key: 'unitCost',
      label: 'Costo Unit.',
      className: 'text-right',
      render: (row) => formatCurrency(row.unitCost),
    },
    {
      key: 'totalCost',
      label: 'Costo Total',
      className: 'text-right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.totalCost)}</span>
      ),
    },
    {
      key: 'notes',
      label: 'Notas',
      render: (row) => (
        <span className="max-w-[200px] truncate block" title={row.notes || ''}>
          {row.notes || '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      search={search}
      sortBy={sortBy}
      sortDir={sortDir}
      searchPlaceholder="Buscar por producto..."
    />
  )
}
