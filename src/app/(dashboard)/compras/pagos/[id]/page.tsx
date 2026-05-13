import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal, formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PaymentActions } from './payment-actions'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  TRANSFER: 'Transferencia',
  CREDIT_CARD: 'Tarjeta de Credito',
}

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        include: {
          invoice: {
            include: {
              supplier: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!payment) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compras/pagos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pago {payment.number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(payment.paymentDate)} - {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
            </p>
          </div>
        </div>
        <PaymentActions paymentId={payment.id} />
      </div>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Numero:</span>
              <p className="font-medium">{payment.number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">{formatDate(payment.paymentDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Metodo de Pago:</span>
              <p className="font-medium">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Monto Total:</span>
              <p className="font-bold text-lg">
                {formatCurrency(serializeDecimal(payment.totalAmount))}
              </p>
            </div>
            {payment.bankAccount && (
              <div>
                <span className="text-muted-foreground">Cuenta Bancaria:</span>
                <p className="font-medium">{payment.bankAccount}</p>
              </div>
            )}
            {payment.reference && (
              <div>
                <span className="text-muted-foreground">Referencia:</span>
                <p className="font-medium">{payment.reference}</p>
              </div>
            )}
            {payment.notes && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Notas:</span>
                <p className="font-medium">{payment.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas Aplicadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total Factura</TableHead>
                  <TableHead className="text-right">Monto Aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/compras/facturas-proveedor/${app.invoice.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {app.invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>{app.invoice.supplier.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(serializeDecimal(app.invoice.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(serializeDecimal(app.amount))}
                    </TableCell>
                  </TableRow>
                ))}
                {payment.applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No hay facturas aplicadas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Total row */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-4">Total Pagado:</span>
              <span className="text-xl font-bold">
                {formatCurrency(serializeDecimal(payment.totalAmount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
