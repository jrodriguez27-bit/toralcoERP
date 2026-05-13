'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CreditNote {
  id: string
  number: string
  ncf: string | null
  invoiceNumber: string
  clientName: string
  amount: string
  reason: string
  createdAt: string
}

interface Props {
  data: CreditNote[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function NotasTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const columns: Column<CreditNote>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'ncf',
      label: 'NCF',
      render: (row) => row.ncf || '-',
    },
    { key: 'invoiceNumber', label: 'Factura' },
    { key: 'clientName', label: 'Cliente' },
    {
      key: 'amount',
      label: 'Monto',
      className: 'text-right',
      sortable: true,
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'reason',
      label: 'Motivo',
      render: (row) => (
        <span className="max-w-[200px] truncate block" title={row.reason}>
          {row.reason}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
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
      searchPlaceholder="Buscar por numero, NCF, factura o cliente..."
    />
  )
}
