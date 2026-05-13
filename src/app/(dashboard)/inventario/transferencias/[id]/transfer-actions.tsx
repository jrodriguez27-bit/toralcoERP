'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  approveTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  deleteTransfer,
} from '../_actions'
import { CheckCircle, Truck, PackageCheck, XCircle, Trash2, ArrowLeft } from 'lucide-react'

interface Props {
  transferId: string
  status: string
}

export function TransferActions({ transferId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  const isRequested = status === 'REQUESTED'
  const isApproved = status === 'APPROVED'
  const isDispatched = status === 'DISPATCHED'
  const canCancel = isRequested || isApproved

  const handleAction = async (action: string) => {
    setLoading(true)
    setError('')

    try {
      switch (action) {
        case 'approve':
          await approveTransfer(transferId)
          break
        case 'dispatch':
          await dispatchTransfer(transferId)
          break
        case 'receive':
          await receiveTransfer(transferId)
          break
        case 'cancel':
          await cancelTransfer(transferId)
          break
        case 'delete':
          await deleteTransfer(transferId)
          router.push('/inventario/transferencias')
          return
      }
      setConfirmAction(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la accion')
      setConfirmAction(null)
    } finally {
      setLoading(false)
    }
  }

  const confirmMessages: Record<string, { title: string; description: string }> = {
    approve: {
      title: 'Aprobar Transferencia',
      description: 'Esta seguro de aprobar esta transferencia? Una vez aprobada, podra ser despachada.',
    },
    dispatch: {
      title: 'Despachar Transferencia',
      description: 'Esta seguro de despachar? Se crearan los movimientos de salida del almacen origen.',
    },
    receive: {
      title: 'Recibir Transferencia',
      description: 'Esta seguro de confirmar la recepcion? Se crearan los movimientos de entrada al almacen destino.',
    },
    cancel: {
      title: 'Cancelar Transferencia',
      description: 'Esta seguro de cancelar esta transferencia? Esta accion no se puede deshacer.',
    },
    delete: {
      title: 'Eliminar Transferencia',
      description: 'Esta seguro de eliminar esta transferencia? Esta accion no se puede deshacer.',
    },
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mt-4">{error}</div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t mt-4">
        {isRequested && (
          <Button
            onClick={() => setConfirmAction('approve')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        )}
        {isApproved && (
          <Button
            onClick={() => setConfirmAction('dispatch')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="mr-2 h-4 w-4" />
            Despachar
          </Button>
        )}
        {isDispatched && (
          <Button
            onClick={() => setConfirmAction('receive')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            Recibir
          </Button>
        )}
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => setConfirmAction('cancel')}
            disabled={loading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        )}
        {isRequested && (
          <Button
            variant="outline"
            onClick={() => setConfirmAction('delete')}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => router.push('/inventario/transferencias')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Lista
        </Button>
      </div>

      {confirmAction && confirmMessages[confirmAction] && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmMessages[confirmAction].title}
          description={confirmMessages[confirmAction].description}
          confirmLabel="Confirmar"
          onConfirm={() => handleAction(confirmAction)}
          variant={confirmAction === 'cancel' || confirmAction === 'delete' ? 'destructive' : 'default'}
        />
      )}
    </>
  )
}
