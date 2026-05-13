'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { issueInvoice, cancelInvoice } from '../_actions'
import { Send, XCircle } from 'lucide-react'

interface Props {
  invoiceId: string
  status: string
  hasCollections: boolean
}

export function InvoiceActions({ invoiceId, status, hasCollections }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showIssue, setShowIssue] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const isDraft = status === 'DRAFT'
  const isIssued = status === 'ISSUED'
  const canCancel = (isDraft || isIssued) && !hasCollections

  const handleIssue = async () => {
    setLoading(true)
    setError('')
    try {
      await issueInvoice(invoiceId)
      setShowIssue(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir factura')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    setError('')
    try {
      await cancelInvoice(invoiceId)
      setShowCancel(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <Button
            onClick={() => setShowIssue(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Emitir Factura
          </Button>
        )}
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => setShowCancel(true)}
            disabled={loading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Factura
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push('/facturacion/facturas')}>
          Volver a Lista
        </Button>
      </div>

      <ConfirmDialog
        open={showIssue}
        onOpenChange={setShowIssue}
        title="Emitir Factura"
        description="Se asignara un NCF (si aplica) y se creara el asiento contable correspondiente. Esta accion no se puede deshacer."
        confirmLabel="Emitir"
        onConfirm={handleIssue}
      />
      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancelar Factura"
        description="La factura sera marcada como cancelada. Esta accion no se puede deshacer."
        confirmLabel="Cancelar Factura"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </>
  )
}
