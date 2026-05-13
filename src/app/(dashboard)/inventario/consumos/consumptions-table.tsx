'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ConsumptionRow {
  id: string
  createdAt: string
  productName: string
  productCode: string
  warehouseName: string
  quantity: string
  unitCost: string
  totalCost: string
  projectName: string
  costCodeName: string
  notes: string | null
}

interface Props {
  data: ConsumptionRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function ConsumptionsTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: Props) {
  const columns: Column<ConsumptionRow>[] = [
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
      key: 'projectName',
      label: 'Proyecto',
    },
    {
      key: 'costCodeName',
      label: 'Codigo de Costo',
    },
    {
      key: 'notes',
      label: 'Notas',
      render: (row) => (
        <span className="max-w-[150px] truncate block" title={row.notes || ''}>
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
      searchPlaceholder="Buscar por producto o proyecto..."
    />
  )
}
