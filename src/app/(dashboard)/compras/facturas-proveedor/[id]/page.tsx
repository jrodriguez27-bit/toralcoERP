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
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { InvoiceActions } from './invoice-actions'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await prisma.supplierInvoice.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      purchaseOrder: true,
      lines: {
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      },
      payments: {
        include: {
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!invoice) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compras/facturas-proveedor">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Factura {invoice.number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {invoice.supplier.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice.status} />
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            hasPayments={invoice.payments.length > 0}
          />
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Numero Interno:</span>
              <span className="font-medium">{invoice.number}</span>

              <span className="text-muted-foreground">No. Factura Proveedor:</span>
              <span className="font-medium">{invoice.supplierInvNumber || '-'}</span>

              <span className="text-muted-foreground">NCF:</span>
              <span className="font-medium">{invoice.ncf || '-'}</span>

              <span className="text-muted-foreground">Proveedor:</span>
              <span className="font-medium">{invoice.supplier.name}</span>

              <span className="text-muted-foreground">Orden de Compra:</span>
              <span className="font-medium">
                {invoice.purchaseOrder ? invoice.purchaseOrder.number : '-'}
              </span>

              <span className="text-muted-foreground">Fecha Factura:</span>
              <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>

              <span className="text-muted-foreground">Fecha Vencimiento:</span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notas:</span>
                <p className="text-sm mt-1">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium text-right">
                {formatCurrency(serializeDecimal(invoice.subtotal))}
              </span>

              <span className="text-muted-foreground">ITBIS:</span>
              <span className="font-medium text-right">
                {formatCurrency(serializeDecimal(invoice.taxAmount))}
              </span>

              <span className="text-muted-foreground">Retencion ISR:</span>
              <span className="font-medium text-right text-red-600">
                -{formatCurrency(serializeDecimal(invoice.isrRetention))}
              </span>

              <span className="text-muted-foreground">Retencion ITBIS:</span>
              <span className="font-medium text-right text-red-600">
                -{formatCurrency(serializeDecimal(invoice.itbisRetention))}
              </span>

              <span className="text-muted-foreground font-semibold">Total:</span>
              <span className="font-bold text-right text-lg">
                {formatCurrency(serializeDecimal(invoice.totalAmount))}
              </span>

              <span className="text-muted-foreground font-semibold">Saldo Pendiente:</span>
              <span className="font-bold text-right text-lg text-blue-600">
                {formatCurrency(serializeDecimal(invoice.balanceDue))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Lineas de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">ITBIS %</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      {line.product
                        ? `${line.product.code} - ${line.product.name}`
                        : '-'}
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">
                      {serializeDecimal(line.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(serializeDecimal(line.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {(Number(serializeDecimal(line.taxRate)) * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(serializeDecimal(line.totalAmount))}
                    </TableCell>
                  </TableRow>
                ))}
                {invoice.lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay lineas en esta factura.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pago</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto Aplicado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/compras/pagos/${app.payment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {app.payment.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDate(app.payment.paymentDate)}
                      </TableCell>
                      <TableCell>
                        {app.payment.paymentMethod === 'CASH'
                          ? 'Efectivo'
                          : app.payment.paymentMethod === 'CHECK'
                            ? 'Cheque'
                            : app.payment.paymentMethod === 'TRANSFER'
                              ? 'Transferencia'
                              : 'Tarjeta'}
                      </TableCell>
                      <TableCell>{app.payment.reference || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(serializeDecimal(app.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
