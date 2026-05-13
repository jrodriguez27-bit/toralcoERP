'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deletePayment } from '../_actions'
import { Trash2 } from 'lucide-react'

interface Props {
  paymentId: string
}

export function PaymentActions({ paymentId }: Props) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDelete(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar Pago
      </Button>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Eliminar Pago"
        description="Se eliminara el pago y se restauraran los saldos de las facturas asociadas. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          setLoading(true)
          try {
            await deletePayment(paymentId)
            setShowDelete(false)
            router.push('/compras/pagos')
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
