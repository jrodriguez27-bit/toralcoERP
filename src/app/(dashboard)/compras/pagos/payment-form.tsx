'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EntitySelect } from '@/components/shared/entity-select'
import { createPayment } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import Decimal from 'decimal.js'

interface PendingInvoice {
  id: string
  number: string
  supplierName: string
  invoiceDate: string
  dueDate: string
  totalAmount: string
  balanceDue: string
}

interface Props {
  pendingInvoices: PendingInvoice[]
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de Credito' },
]

export function PaymentForm({ pendingInvoices }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Header state
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  // Invoice selection state
  const [selectedInvoices, setSelectedInvoices] = useState<
    Record<string, { selected: boolean; amount: string }>
  >({})

  const toggleInvoice = (invoiceId: string, balanceDue: string) => {
    setSelectedInvoices((prev) => {
      const current = prev[invoiceId]
      if (current?.selected) {
        const { [invoiceId]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [invoiceId]: { selected: true, amount: balanceDue },
      }
    })
  }

  const updateInvoiceAmount = (invoiceId: string, amount: string) => {
    setSelectedInvoices((prev) => ({
      ...prev,
      [invoiceId]: { ...prev[invoiceId], amount },
    }))
  }

  const computeTotal = (): Decimal => {
    let total = new Decimal(0)
    for (const invoiceId of Object.keys(selectedInvoices)) {
      if (selectedInvoices[invoiceId]?.selected) {
        try {
          total = total.plus(new Decimal(selectedInvoices[invoiceId].amount || '0'))
        } catch {
          // Skip invalid amounts
        }
      }
    }
    return total
  }

  const total = computeTotal()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const applications = Object.entries(selectedInvoices)
        .filter(([, data]) => data.selected && new Decimal(data.amount || '0').gt(0))
        .map(([invoiceId, data]) => ({
          invoiceId,
          amount: data.amount,
        }))

      if (applications.length === 0) {
        throw new Error('Debe seleccionar al menos una factura para pagar')
      }

      const result = await createPayment({
        paymentDate,
        paymentMethod: paymentMethod as 'CASH' | 'CHECK' | 'TRANSFER' | 'CREDIT_CARD',
        bankAccount: bankAccount || null,
        reference: reference || null,
        notes: notes || null,
        applications,
      })

      router.push(`/compras/pagos/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Pago a Proveedores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo de Pago *</Label>
              <EntitySelect
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="Seleccionar metodo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Numero de cuenta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="No. cheque, transferencia, etc."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Facturas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sel.</TableHead>
                  <TableHead>No. Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="w-40 text-right">Monto a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((inv) => {
                  const isSelected = selectedInvoices[inv.id]?.selected || false
                  return (
                    <TableRow key={inv.id} className={isSelected ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInvoice(inv.id, inv.balanceDue)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{inv.number}</TableCell>
                      <TableCell>{inv.supplierName}</TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.balanceDue)}
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={inv.balanceDue}
                            value={selectedInvoices[inv.id]?.amount || ''}
                            onChange={(e) => updateInvoiceAmount(inv.id, e.target.value)}
                            className="text-right"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {pendingInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay facturas pendientes de pago.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-4">Total a Pagar:</span>
              <span className="text-xl font-bold">
                {formatCurrency(total.toFixed(2))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading || total.lte(0)}>
          {loading ? 'Procesando...' : 'Registrar Pago'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
