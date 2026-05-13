'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { deleteLead } from './_actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Lead {
  id: string
  name: string
  company: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  source: string | null
  stage: string
  estimatedValue: string | null
  probability: number | null
  nextFollowUp: string | null
  clientId: string | null
  createdAt: string
}

interface Props {
  data: Lead[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function LeadsTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Lead>[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    {
      key: 'company',
      label: 'Empresa',
      render: (row) => row.company || '-',
    },
    {
      key: 'stage',
      label: 'Etapa',
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: 'estimatedValue',
      label: 'Valor Estimado',
      className: 'text-right',
      render: (row) => (row.estimatedValue ? formatCurrency(row.estimatedValue) : '-'),
    },
    {
      key: 'probability',
      label: 'Probabilidad',
      className: 'text-center',
      render: (row) => (row.probability != null ? `${row.probability}%` : '-'),
    },
    {
      key: 'nextFollowUp',
      label: 'Seguimiento',
      sortable: true,
      render: (row) => (row.nextFollowUp ? formatDate(row.nextFollowUp) : '-'),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/crm/leads/${row.id}`}>
              <Pencil className="h-4 w-4" />
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
        searchPlaceholder="Buscar por nombre, empresa, contacto o email..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Lead"
        description="Esta accion no se puede deshacer. El lead y todas sus actividades seran eliminados."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteLead(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
