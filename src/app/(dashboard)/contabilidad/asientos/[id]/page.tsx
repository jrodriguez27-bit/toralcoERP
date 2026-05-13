import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDate, formatDateTime, serializeDecimal } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EntryActions } from './entry-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

export default async function JournalEntryDetailPage({ params }: { params: { id: string } }) {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: params.id },
    include: {
      period: true,
      lines: {
        include: { account: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!entry) notFound()

  const totalDebit = serializeDecimal(entry.totalDebit)
  const totalCredit = serializeDecimal(entry.totalCredit)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contabilidad/asientos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Asiento {entry.number}</h1>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacion del Asiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Numero</p>
              <p className="text-sm">{entry.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-sm">{formatDate(entry.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Periodo</p>
              <p className="text-sm">{entry.period.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-sm">{entry.type === 'MANUAL' ? 'Manual' : 'Automatico'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Referencia</p>
              <p className="text-sm">{entry.reference || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creado</p>
              <p className="text-sm">{formatDateTime(entry.createdAt)}</p>
            </div>
            {entry.postedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contabilizado</p>
                <p className="text-sm">{formatDateTime(entry.postedAt)}</p>
              </div>
            )}
            {entry.notes && (
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                <p className="text-sm">{entry.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lineas del Asiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Debito</TableHead>
                  <TableHead className="text-right">Credito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      {line.account.code} - {line.account.name}
                    </TableCell>
                    <TableCell>{line.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(serializeDecimal(line.debit))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(serializeDecimal(line.credit))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">
                    Totales
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalDebit)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalCredit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EntryActions entryId={entry.id} status={entry.status} />
    </div>
  )
}
