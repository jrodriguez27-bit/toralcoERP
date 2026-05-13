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
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  TRANSFER: 'Transferencia',
  CREDIT_CARD: 'Tarjeta de Credito',
}

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        include: {
          invoice: {
            select: { id: true, number: true, client: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!collection) notFound()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cobro {collection.number}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">{formatDate(collection.collectionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metodo de Pago</p>
              <p className="font-medium">
                {PAYMENT_METHOD_LABELS[collection.paymentMethod] || collection.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto Total</p>
              <p className="text-xl font-bold">{formatCurrency(collection.totalAmount.toString())}</p>
            </div>
            {collection.bankAccount && (
              <div>
                <p className="text-sm text-muted-foreground">Cuenta Bancaria</p>
                <p className="font-medium">{collection.bankAccount}</p>
              </div>
            )}
            {collection.reference && (
              <div>
                <p className="text-sm text-muted-foreground">Referencia</p>
                <p className="font-medium">{collection.reference}</p>
              </div>
            )}
            {collection.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm">{collection.notes}</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/facturacion/cobros">Volver a Lista</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturas Aplicadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Monto Aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/facturacion/facturas/${app.invoice.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {app.invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>{app.invoice.client.name}</TableCell>
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
    </div>
  )
}
