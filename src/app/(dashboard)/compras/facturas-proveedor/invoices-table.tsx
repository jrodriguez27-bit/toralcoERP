'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteSupplierInvoice } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  number: string
  supplierInvNumber: string | null
  supplierName: string
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
    { key: 'supplierInvNumber', label: 'No. Factura Prov.' },
    { key: 'supplierName', label: 'Proveedor', sortable: true },
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
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'balanceDue',
      label: 'Saldo',
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
            <Link href={`/compras/facturas-proveedor/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => setDeleteId(row.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
        searchPlaceholder="Buscar por numero, proveedor..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Factura"
        description="Esta accion eliminara la factura de forma permanente. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteSupplierInvoice(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
