'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deletePurchaseOrder } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Order {
  id: string
  number: string
  status: string
  totalAmount: string
  createdAt: string
  supplier: { id: string; name: string }
  project: { id: string; name: string }
}

interface Props {
  data: Order[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function OrdersTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Order>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'supplier',
      label: 'Proveedor',
      render: (row) => row.supplier?.name || '-',
    },
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
      label: 'Total',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/compras/ordenes-compra/${row.id}`}>
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
        searchPlaceholder="Buscar por numero, proveedor o proyecto..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Orden de Compra"
        description="Esta accion no se puede deshacer. La orden de compra y todas sus lineas seran eliminadas."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deletePurchaseOrder(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
