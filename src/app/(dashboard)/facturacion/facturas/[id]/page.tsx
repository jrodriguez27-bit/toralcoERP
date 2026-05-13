import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceActions } from './invoice-actions'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await prisma.clientInvoice.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, code: true, name: true, rnc: true } },
      lines: {
        include: { product: { select: { id: true, code: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      creditNotes: {
        orderBy: { createdAt: 'desc' },
      },
      collections: {
        include: {
          collection: { select: { id: true, number: true, collectionDate: true, paymentMethod: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!invoice) notFound()

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: 'Efectivo',
    CHECK: 'Cheque',
    TRANSFER: 'Transferencia',
    CREDIT_CARD: 'Tarjeta de Credito',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Factura {invoice.number}</CardTitle>
            <StatusBadge status={invoice.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{invoice.client.name}</p>
              {invoice.client.rnc && (
                <p className="text-sm text-muted-foreground">RNC: {invoice.client.rnc}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NCF</p>
              <p className="font-medium">{invoice.ncf || 'Sin NCF'}</p>
              {invoice.ncfType && (
                <p className="text-sm text-muted-foreground">Tipo: {invoice.ncfType}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fechas</p>
              <p className="text-sm">Emision: {formatDate(invoice.invoiceDate)}</p>
              <p className="text-sm">Vencimiento: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          {invoice.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <InvoiceActions
              invoiceId={invoice.id}
              status={invoice.status}
              hasCollections={invoice.collections.length > 0}
            />
          </div>
        </CardContent>
      </Card>

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
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">ITBIS</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {line.product ? `${line.product.code} - ${line.product.name}` : '-'}
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.quantity.toString()}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitPrice.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      {(parseFloat(line.taxRate.toString()) * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.totalAmount.toString())}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="space-y-1 text-right">
              <div className="flex justify-between gap-8">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal.toString())}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-sm text-muted-foreground">ITBIS:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.taxAmount.toString())}
                </span>
              </div>
              <div className="flex justify-between gap-8 pt-2 border-t">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(invoice.totalAmount.toString())}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-sm text-muted-foreground">Balance Pendiente:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(invoice.balanceDue.toString())}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Notes */}
      {invoice.creditNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notas de Credito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>NCF</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.creditNotes.map((cn) => (
                    <TableRow key={cn.id}>
                      <TableCell className="font-medium">{cn.number}</TableCell>
                      <TableCell>{cn.ncf || '-'}</TableCell>
                      <TableCell>{cn.reason}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cn.amount.toString())}
                      </TableCell>
                      <TableCell>{formatDate(cn.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections */}
      {invoice.collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cobros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero de Cobro</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Metodo de Pago</TableHead>
                    <TableHead className="text-right">Monto Aplicado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.collections.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.collection.number}</TableCell>
                      <TableCell>{formatDate(app.collection.collectionDate)}</TableCell>
                      <TableCell>
                        {PAYMENT_METHOD_LABELS[app.collection.paymentMethod] || app.collection.paymentMethod}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(app.amount.toString())}
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
