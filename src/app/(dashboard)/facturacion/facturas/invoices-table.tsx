'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteInvoice } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  number: string
  ncf: string | null
  ncfType: string | null
  clientName: string
  invoiceDate: string
  dueDate: string
  totalAmount: string
  balanceDue: string
  status: string
}

interface Props {
  data: Invoice[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function InvoicesTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Invoice>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'ncf',
      label: 'NCF',
      render: (row) => row.ncf || '-',
    },
    {
      key: 'clientName',
      label: 'Cliente',
      sortable: false,
    },
    {
      key: 'invoiceDate',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.invoiceDate),
    },
    {
      key: 'dueDate',
      label: 'Vencimiento',
      sortable: true,
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      className: 'text-right',
      sortable: true,
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'balanceDue',
      label: 'Balance',
      className: 'text-right',
      render: (row) => formatCurrency(row.balanceDue),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/facturacion/facturas/${row.id}`}>
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
        searchPlaceholder="Buscar por numero, NCF o cliente..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Factura"
        description="Esta accion no se puede deshacer. La factura y todas sus lineas seran eliminadas."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteInvoice(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
