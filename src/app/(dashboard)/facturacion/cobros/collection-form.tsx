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
import { createCollection } from './_actions'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface InvoiceData {
  id: string
  number: string
  clientName: string
  totalAmount: string
  balanceDue: string
}

interface Props {
  invoices: InvoiceData[]
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de Credito' },
]

export function CollectionForm({ invoices }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, string>>({})

  const toggleInvoice = (invoiceId: string, balance: string) => {
    setSelectedInvoices((prev) => {
      const next = { ...prev }
      if (next[invoiceId] !== undefined) {
        delete next[invoiceId]
      } else {
        next[invoiceId] = balance
      }
      return next
    })
  }

  const updateAmount = (invoiceId: string, amount: string) => {
    setSelectedInvoices((prev) => ({ ...prev, [invoiceId]: amount }))
  }

  const computeTotal = (): string => {
    try {
      const total = Object.values(selectedInvoices).reduce(
        (acc, amt) => acc.plus(new Decimal(amt || '0')),
        new Decimal(0)
      )
      return total.toFixed(2)
    } catch {
      return '0.00'
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const applications = Object.entries(selectedInvoices).map(([invoiceId, amount]) => ({
        invoiceId,
        amount,
      }))

      await createCollection({
        collectionDate,
        paymentMethod: paymentMethod as 'CASH' | 'CHECK' | 'TRANSFER' | 'CREDIT_CARD',
        bankAccount: bankAccount || null,
        reference: reference || null,
        notes: notes || null,
        applications,
      })
      router.push('/facturacion/cobros')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cobro')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = computeTotal()
  const hasApplications = Object.keys(selectedInvoices).length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Cobro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="collectionDate">Fecha de Cobro *</Label>
                <Input
                  id="collectionDate"
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
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
                  placeholder="Numero de cheque, transferencia, etc."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aplicar a Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sel.</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Factura</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Monto a Aplicar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay facturas pendientes de cobro.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => {
                    const isSelected = selectedInvoices[inv.id] !== undefined
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleInvoice(inv.id, inv.balanceDue)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{inv.number}</TableCell>
                        <TableCell>{inv.clientName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.balanceDue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSelected ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={inv.balanceDue}
                              value={selectedInvoices[inv.id]}
                              onChange={(e) => updateAmount(inv.id, e.target.value)}
                              className="text-right w-32 ml-auto"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-4">Total a Cobrar:</span>
              <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading || !collectionDate || !paymentMethod || !hasApplications}
        >
          {loading ? 'Guardando...' : 'Registrar Cobro'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
