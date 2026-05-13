'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { postJournalEntryAction, deleteJournalEntry } from './_actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface JournalEntry {
  id: string
  number: string
  date: string
  description: string
  type: string
  totalDebit: string
  totalCredit: string
  status: string
  periodName: string
  lineCount: number
  createdAt: string
}

interface Props {
  data: JournalEntry[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function JournalEntriesTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [postId, setPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePost = async () => {
    if (!postId) return
    setLoading(true)
    try {
      await postJournalEntryAction(postId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al contabilizar')
    } finally {
      setLoading(false)
      setPostId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      await deleteJournalEntry(deleteId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }

  const columns: Column<JournalEntry>[] = [
    { key: 'number', label: 'Numero', sortable: true },
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    { key: 'description', label: 'Descripcion' },
    {
      key: 'type',
      label: 'Tipo',
      render: (row) => (row.type === 'MANUAL' ? 'Manual' : 'Automatico'),
    },
    {
      key: 'totalDebit',
      label: 'Debito',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalDebit),
    },
    {
      key: 'totalCredit',
      label: 'Credito',
      className: 'text-right',
      render: (row) => formatCurrency(row.totalCredit),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/contabilidad/asientos/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'DRAFT' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={() => setPostId(row.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600"
                onClick={() => setDeleteId(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
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
        searchPlaceholder="Buscar por numero o descripcion..."
      />
      <ConfirmDialog
        open={!!postId}
        onOpenChange={() => setPostId(null)}
        title="Contabilizar Asiento"
        description="Una vez contabilizado, el asiento no podra ser editado. Solo podra ser reversado."
        confirmLabel="Contabilizar"
        onConfirm={handlePost}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Asiento"
        description="Esta accion eliminara el asiento de forma permanente. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
