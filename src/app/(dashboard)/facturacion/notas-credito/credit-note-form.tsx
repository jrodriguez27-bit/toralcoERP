'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createCreditNote } from './_actions'
import { formatCurrency } from '@/lib/utils'

interface InvoiceOption {
  value: string
  label: string
  balance: string
}

interface Props {
  invoices: InvoiceOption[]
}

export function CreditNoteForm({ invoices }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const selectedInvoice = invoices.find((inv) => inv.value === invoiceId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createCreditNote({
        invoiceId,
        amount,
        reason,
      })
      router.push('/facturacion/notas-credito')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear nota de credito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Nota de Credito</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Factura *</Label>
              <EntitySelect
                value={invoiceId}
                onValueChange={setInvoiceId}
                options={invoices}
                placeholder="Seleccionar factura..."
              />
              {selectedInvoice && (
                <p className="text-sm text-muted-foreground">
                  Balance pendiente: {formatCurrency(selectedInvoice.balance)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoice?.balance || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Motivo de la nota de credito..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !invoiceId || !amount || !reason}>
              {loading ? 'Creando...' : 'Crear Nota de Credito'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
