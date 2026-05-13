'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT_IN: 'Ajuste Entrada',
  ADJUSTMENT_OUT: 'Ajuste Salida',
  TRANSFER_IN: 'Transferencia Entrada',
  TRANSFER_OUT: 'Transferencia Salida',
}

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  ENTRY: 'bg-green-100 text-green-800',
  EXIT: 'bg-red-100 text-red-800',
  ADJUSTMENT_IN: 'bg-blue-100 text-blue-800',
  ADJUSTMENT_OUT: 'bg-orange-100 text-orange-800',
  TRANSFER_IN: 'bg-purple-100 text-purple-800',
  TRANSFER_OUT: 'bg-indigo-100 text-indigo-800',
}

interface MovementRow {
  id: string
  createdAt: string
  productName: string
  productCode: string
  warehouseName: string
  type: string
  quantity: string
  unitCost: string
  totalCost: string
  reference: string | null
  referenceType: string | null
  projectName: string | null
  costCodeName: string | null
  notes: string | null
}

interface Props {
  data: MovementRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function MovementsTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: Props) {
  const columns: Column<MovementRow>[] = [
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
        <Badge className={MOVEMENT_TYPE_COLORS[row.type] || 'bg-gray-100 text-gray-800'}>
          {MOVEMENT_TYPE_LABELS[row.type] || row.type}
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
      label: 'Costo Unitario',
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
      key: 'reference',
      label: 'Referencia',
      render: (row) => row.reference || '-',
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
      searchPlaceholder="Buscar por producto o referencia..."
    />
  )
}
