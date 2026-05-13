'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteFixedAsset } from './_actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Asset {
  id: string
  code: string
  name: string
  status: string
  acquisitionDate: string
  acquisitionCost: string
  accumulatedDepreciation: string
  bookValue: string
  category: { id: string; name: string }
}

interface Props {
  data: Asset[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function AssetsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Asset>[] = [
    { key: 'code', label: 'Codigo', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    {
      key: 'category',
      label: 'Categoria',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'acquisitionDate',
      label: 'Fecha Adquisicion',
      sortable: true,
      render: (row) => formatDate(row.acquisitionDate),
    },
    {
      key: 'acquisitionCost',
      label: 'Costo',
      className: 'text-right',
      render: (row) => formatCurrency(row.acquisitionCost),
    },
    {
      key: 'accumulatedDepreciation',
      label: 'Dep. Acumulada',
      className: 'text-right',
      render: (row) => formatCurrency(row.accumulatedDepreciation),
    },
    {
      key: 'bookValue',
      label: 'Valor en Libros',
      className: 'text-right',
      render: (row) => formatCurrency(row.bookValue),
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
            <Link href={`/activos-fijos/registro/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => setDeleteId(row.id)}
            disabled={row.status === 'DISPOSED'}
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
        searchPlaceholder="Buscar por codigo, nombre, serie o categoria..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Activo Fijo"
        description="Esta accion no se puede deshacer. El activo sera eliminado permanentemente."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteFixedAsset(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
