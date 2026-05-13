'use client'

import Link from 'next/link'
import { DataTable, Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Eye } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
}

interface RunRow {
  id: string
  number: string
  periodStart: string
  periodEnd: string
  type: string
  status: string
  totalGross: string
  totalNet: string
}

interface RunsTableProps {
  data: RunRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function RunsTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: RunsTableProps) {
  const columns: Column<RunRow>[] = [
    { key: 'number', label: 'Número', sortable: true },
    {
      key: 'period',
      label: 'Período',
      render: (row) => `${formatDate(row.periodStart)} - ${formatDate(row.periodEnd)}`,
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row) => TYPE_LABELS[row.type] || row.type,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalGross',
      label: 'Bruto',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalGross),
    },
    {
      key: 'totalNet',
      label: 'Neto',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalNet),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/nomina/corridas/${row.id}`}>
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
      searchPlaceholder="Buscar corridas..."
    />
  )
}
