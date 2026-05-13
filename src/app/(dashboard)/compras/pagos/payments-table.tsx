'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deletePayment } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  TRANSFER: 'Transferencia',
  CREDIT_CARD: 'Tarjeta de Credito',
}

interface Payment {
  id: string
  number: string
  paymentDate: string
  paymentMethod: string
  totalAmount: string
  reference: string | null
  invoiceCount: number
}

interface Props {
  data: Payment[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function PaymentsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Payment>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'paymentDate',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.paymentDate),
    },
    {
      key: 'paymentMethod',
      label: 'Metodo',
      render: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod] || row.paymentMethod,
    },
    {
      key: 'totalAmount',
      label: 'Monto',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalAmount),
    },
    { key: 'reference', label: 'Referencia' },
    {
      key: 'invoiceCount',
      label: 'Facturas',
      className: 'text-center',
      render: (row) => row.invoiceCount.toString(),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/compras/pagos/${row.id}`}>
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
        title="Eliminar Pago"
        description="Se eliminara el pago y se restauraran los saldos de las facturas asociadas. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deletePayment(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
