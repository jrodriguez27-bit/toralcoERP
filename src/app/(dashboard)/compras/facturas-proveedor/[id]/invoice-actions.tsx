'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { cancelSupplierInvoice, deleteSupplierInvoice } from '../_actions'
import { Ban, Trash2 } from 'lucide-react'

interface Props {
  invoiceId: string
  status: string
  hasPayments: boolean
}

export function InvoiceActions({ invoiceId, status, hasPayments }: Props) {
  const router = useRouter()
  const [showCancel, setShowCancel] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  if (status !== 'PENDING') return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCancel(true)}
        disabled={hasPayments}
      >
        <Ban className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDelete(true)}
        disabled={hasPayments}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>

      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancelar Factura"
        description="Se marcara la factura como cancelada. Esta accion no se puede deshacer."
        confirmLabel="Cancelar Factura"
        variant="destructive"
        onConfirm={async () => {
          setLoading(true)
          try {
            await cancelSupplierInvoice(invoiceId)
            setShowCancel(false)
            router.refresh()
          } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al cancelar')
          } finally {
            setLoading(false)
          }
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Eliminar Factura"
        description="Se eliminara la factura de forma permanente. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          setLoading(true)
          try {
            await deleteSupplierInvoice(invoiceId)
            setShowDelete(false)
            router.push('/compras/facturas-proveedor')
          } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al eliminar')
          } finally {
            setLoading(false)
          }
        }}
      />
    </>
  )
}
