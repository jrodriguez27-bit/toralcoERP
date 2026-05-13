'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface TransferRow {
  id: string
  number: string
  createdAt: string
  fromWarehouseName: string
  toWarehouseName: string
  status: string
  lineCount: number
  notes: string | null
}

interface Props {
  data: TransferRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function TransfersTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: Props) {
  const columns: Column<TransferRow>[] = [
    {
      key: 'number',
      label: 'Numero',
      sortable: true,
      render: (row) => (
        <Link
          href={`/inventario/transferencias/${row.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.number}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'fromWarehouseName',
      label: 'Almacen Origen',
    },
    {
      key: 'toWarehouseName',
      label: 'Almacen Destino',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lineCount',
      label: 'Lineas',
      className: 'text-center',
      render: (row) => <span className="tabular-nums">{row.lineCount}</span>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/inventario/transferencias/${row.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
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
      searchPlaceholder="Buscar por numero o almacen..."
    />
  )
}
