import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { TransferActions } from './transfer-actions'

export default async function TransferDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: params.id },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      lines: true,
    },
  })

  if (!transfer) notFound()

  // Fetch product details for lines
  const productIds = transfer.lines.map((l) => l.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  const linesData = transfer.lines.map((line) => {
    const product = productMap.get(line.productId)
    return {
      id: line.id,
      productCode: product?.code || '-',
      productName: product?.name || 'Producto no encontrado',
      productUnit: product?.unit || '-',
      quantity: line.quantity.toString(),
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader title={`Transferencia ${transfer.number}`} />

      {/* Detail Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos de la Transferencia</CardTitle>
            <StatusBadge status={transfer.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Numero</p>
              <p className="font-medium">{transfer.number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">{formatDate(transfer.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <StatusBadge status={transfer.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Almacen Origen</p>
              <p className="font-medium">{transfer.fromWarehouse.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Almacen Destino</p>
              <p className="font-medium">{transfer.toWarehouse.name}</p>
            </div>
            {transfer.notes && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="font-medium">{transfer.notes}</p>
              </div>
            )}
            {transfer.approvedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Aprobado</p>
                <p className="font-medium">{formatDate(transfer.approvedAt)}</p>
              </div>
            )}
            {transfer.dispatchedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Despachado</p>
                <p className="font-medium">{formatDate(transfer.dispatchedAt)}</p>
              </div>
            )}
            {transfer.receivedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Recibido</p>
                <p className="font-medium">{formatDate(transfer.receivedAt)}</p>
              </div>
            )}
          </div>

          {/* Workflow Actions */}
          <TransferActions
            transferId={transfer.id}
            status={transfer.status}
          />
        </CardContent>
      </Card>

      {/* Lines Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lineas de la Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linesData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay lineas en esta transferencia.
                    </TableCell>
                  </TableRow>
                ) : (
                  linesData.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">{line.productCode}</TableCell>
                      <TableCell className="font-medium">{line.productName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(line.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{line.productUnit}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
