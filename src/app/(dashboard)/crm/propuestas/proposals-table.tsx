'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteProposal } from './_actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Proposal {
  id: string
  number: string
  title: string
  status: string
  totalAmount: string
  validUntil: string | null
  createdAt: string
  lead: { id: string; name: string }
}

interface Props {
  data: Proposal[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function ProposalsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Proposal>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    { key: 'title', label: 'Titulo' },
    {
      key: 'lead',
      label: 'Lead',
      render: (row) => (
        <Link href={`/crm/leads/${row.lead.id}`} className="text-blue-600 hover:underline">
          {row.lead.name}
        </Link>
      ),
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
      key: 'validUntil',
      label: 'Valida Hasta',
      sortable: true,
      render: (row) => (row.validUntil ? formatDate(row.validUntil) : '-'),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/crm/propuestas/${row.id}`}>
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
        searchPlaceholder="Buscar por numero, titulo o lead..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Propuesta"
        description="Esta accion no se puede deshacer. La propuesta y todas sus lineas seran eliminadas."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteProposal(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
