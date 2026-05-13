'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteCollection } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Collection {
  id: string
  number: string
  collectionDate: string
  paymentMethod: string
  totalAmount: string
  reference: string | null
  applicationCount: number
}

interface Props {
  data: Collection[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function CollectionsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Collection>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'collectionDate',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.collectionDate),
    },
    { key: 'paymentMethod', label: 'Metodo de Pago' },
    {
      key: 'totalAmount',
      label: 'Monto Total',
      className: 'text-right',
      sortable: true,
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'reference',
      label: 'Referencia',
      render: (row) => row.reference || '-',
    },
    {
      key: 'applicationCount',
      label: 'Facturas',
      className: 'text-center',
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/facturacion/cobros/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => setDeleteId(row.id)}
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
        searchPlaceholder="Buscar por numero o referencia..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Cobro"
        description="Se revertiran las aplicaciones a las facturas correspondientes. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteCollection(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
