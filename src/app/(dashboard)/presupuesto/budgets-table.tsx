'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteBudget } from './_actions'
import { formatCurrency } from '@/lib/utils'

interface Budget {
  id: string
  code: string
  name: string
  status: string
  totalAmount: string
  project: { id: string; name: string }
}

interface Props {
  data: Budget[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function BudgetsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Budget>[] = [
    { key: 'code', label: 'Codigo', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    {
      key: 'project',
      label: 'Proyecto',
      render: (row) => row.project?.name || '-',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      label: 'Monto Total',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/presupuesto/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/presupuesto/${row.id}/ejecucion`}>
              <BarChart3 className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => setDeleteId(row.id)}
            disabled={row.status === 'APPROVED'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        searchPlaceholder="Buscar por nombre o codigo..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Presupuesto"
        description="Esta accion no se puede deshacer. El presupuesto y todas sus lineas seran eliminados."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteBudget(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
