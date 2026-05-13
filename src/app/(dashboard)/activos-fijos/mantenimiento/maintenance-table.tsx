'use client'

import { DataTable, Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Pencil, CheckCircle, XCircle, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { completeMaintenance, cancelMaintenance, startMaintenance } from './_actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Maintenance {
  id: string
  type: string
  description: string
  scheduledDate: string | null
  completedDate: string | null
  cost: string
  vendor: string | null
  status: string
  asset: { id: string; code: string; name: string }
}

interface Props {
  data: Maintenance[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

const typeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
}

export function MaintenanceTable({ data, totalCount, page, pageSize, search, sortBy, sortDir }: Props) {
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null)

  const handleAction = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.action === 'complete') {
        await completeMaintenance(confirmAction.id)
      } else if (confirmAction.action === 'cancel') {
        await cancelMaintenance(confirmAction.id)
      } else if (confirmAction.action === 'start') {
        await startMaintenance(confirmAction.id)
      }
      setConfirmAction(null)
      router.refresh()
    } catch (err) {
      // Error handled by server action
      setConfirmAction(null)
    }
  }

  const confirmLabels: Record<string, { title: string; description: string; label: string }> = {
    complete: {
      title: 'Completar Mantenimiento',
      description: 'Se marcara el mantenimiento como completado con la fecha actual.',
      label: 'Completar',
    },
    cancel: {
      title: 'Cancelar Mantenimiento',
      description: 'Se cancelara el mantenimiento. Esta accion no se puede deshacer.',
      label: 'Cancelar Mantenimiento',
    },
    start: {
      title: 'Iniciar Mantenimiento',
      description: 'Se marcara el mantenimiento como en progreso.',
      label: 'Iniciar',
    },
  }

  const columns: Column<Maintenance>[] = [
    {
      key: 'asset',
      label: 'Activo',
      render: (row) => (
        <Link href={`/activos-fijos/registro/${row.asset.id}`} className="text-blue-600 hover:underline">
          {row.asset.code} - {row.asset.name}
        </Link>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (row) => typeLabels[row.type] || row.type,
    },
    {
      key: 'description',
      label: 'Descripcion',
      render: (row) => row.description,
    },
    {
      key: 'scheduledDate',
      label: 'Fecha Programada',
      sortable: true,
      render: (row) => (row.scheduledDate ? formatDate(row.scheduledDate) : '-'),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'cost',
      label: 'Costo',
      className: 'text-right',
      render: (row) => formatCurrency(row.cost),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'w-36',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'SCHEDULED' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600"
              title="Iniciar"
              onClick={() => setConfirmAction({ id: row.id, action: 'start' })}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {(row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS') && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                title="Completar"
                onClick={() => setConfirmAction({ id: row.id, action: 'complete' })}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600"
                title="Cancelar"
                onClick={() => setConfirmAction({ id: row.id, action: 'cancel' })}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const current = confirmAction ? confirmLabels[confirmAction.action] : null

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
        searchPlaceholder="Buscar por descripcion, proveedor o activo..."
      />
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={current?.title || ''}
        description={current?.description || ''}
        confirmLabel={current?.label || 'Confirmar'}
        variant={confirmAction?.action === 'cancel' ? 'destructive' : 'default'}
        onConfirm={handleAction}
      />
    </>
  )
}
