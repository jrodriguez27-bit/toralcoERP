'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteRequisition } from './_actions'
import { formatDate } from '@/lib/utils'

interface Requisition {
  id: string
  number: string
  description: string | null
  status: string
  requestedBy: string
  createdAt: string
  project: { id: string; name: string }
  lineCount: number
}

interface Props {
  data: Requisition[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function RequisitionsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Requisition>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'project',
      label: 'Proyecto',
      render: (row) => row.project?.name || '-',
    },
    {
      key: 'description',
      label: 'Descripcion',
      render: (row) => row.description || '-',
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
      render: (row) => row.lineCount,
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/compras/requisiciones/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => setDeleteId(row.id)}
            disabled={row.status !== 'DRAFT'}
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
        searchPlaceholder="Buscar por numero, descripcion o proyecto..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Requisicion"
        description="Esta accion no se puede deshacer. La requisicion y todas sus lineas seran eliminadas."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteRequisition(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
