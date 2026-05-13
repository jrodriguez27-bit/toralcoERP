'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Power } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteNcfSequence, toggleNcfActive } from './_actions'
import { formatDate } from '@/lib/utils'

const NCF_TYPE_LABELS: Record<string, string> = {
  B01: 'B01 - Fiscal',
  B02: 'B02 - Consumidor',
  B14: 'B14 - Gubernamental',
  B15: 'B15 - Especial',
}

interface NcfSequence {
  id: string
  type: string
  prefix: string
  currentNumber: number
  rangeFrom: number
  rangeTo: number
  remaining: number
  expirationDate: string | null
  isActive: boolean
}

interface Props {
  data: NcfSequence[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function NcfTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)

  const toggleTarget = data.find((s) => s.id === toggleId)

  const columns: Column<NcfSequence>[] = [
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (row) => NCF_TYPE_LABELS[row.type] || row.type,
    },
    { key: 'prefix', label: 'Prefijo', sortable: true },
    {
      key: 'currentNumber',
      label: 'Numero Actual',
      sortable: true,
      className: 'text-center',
    },
    {
      key: 'range',
      label: 'Rango',
      render: (row) => `${row.rangeFrom} - ${row.rangeTo}`,
    },
    {
      key: 'remaining',
      label: 'Disponibles',
      className: 'text-center',
      render: (row) => {
        const pct = (row.remaining / (row.rangeTo - row.rangeFrom + 1)) * 100
        return (
          <span className={pct < 10 ? 'text-red-600 font-medium' : pct < 25 ? 'text-yellow-600' : ''}>
            {row.remaining}
          </span>
        )
      },
    },
    {
      key: 'expirationDate',
      label: 'Vencimiento',
      sortable: true,
      render: (row) => (row.expirationDate ? formatDate(row.expirationDate) : '-'),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/facturacion/ncf/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setToggleId(row.id)}
          >
            <Power className={`h-4 w-4 ${row.isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={() => setDeleteId(row.id)}
            disabled={row.currentNumber > 0}
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
        searchPlaceholder="Buscar por tipo o prefijo..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Secuencia NCF"
        description="Esta accion no se puede deshacer. La secuencia sera eliminada permanentemente."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteNcfSequence(deleteId)
            setDeleteId(null)
          }
        }}
      />
      <ConfirmDialog
        open={!!toggleId}
        onOpenChange={() => setToggleId(null)}
        title={toggleTarget?.isActive ? 'Desactivar Secuencia' : 'Activar Secuencia'}
        description={
          toggleTarget?.isActive
            ? 'La secuencia dejara de estar disponible para emitir comprobantes.'
            : 'La secuencia estara disponible para emitir comprobantes.'
        }
        confirmLabel={toggleTarget?.isActive ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.isActive ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (toggleId) {
            await toggleNcfActive(toggleId)
            setToggleId(null)
          }
        }}
      />
    </>
  )
}
