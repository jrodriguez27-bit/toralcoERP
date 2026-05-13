'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { sendProposal, acceptProposal, rejectProposal } from '../_actions'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Send, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  proposal: {
    id: string
    number: string
    leadId: string
    title: string
    status: string
    validUntil: string | null
    notes: string | null
    subtotal: string
    taxAmount: string
    totalAmount: string
    lines: {
      id: string
      description: string
      quantity: string
      unitPrice: string
      totalAmount: string
    }[]
  }
  leadName: string
}

export function ProposalActions({ proposal, leadName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (action: (id: string) => Promise<{ success: boolean }>) => {
    setLoading(true)
    setError('')
    try {
      await action(proposal.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Propuesta {proposal.number}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{proposal.title}</p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div>
              <span className="text-sm text-muted-foreground">Lead:</span>
              <Link href={`/crm/leads/${proposal.leadId}`} className="text-sm text-blue-600 hover:underline block">
                {leadName}
              </Link>
            </div>
            {proposal.validUntil && (
              <div>
                <span className="text-sm text-muted-foreground">Valida hasta:</span>
                <p className="text-sm">{proposal.validUntil}</p>
              </div>
            )}
            {proposal.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Notas:</span>
                <p className="text-sm">{proposal.notes}</p>
              </div>
            )}
          </div>

          {/* Workflow buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {proposal.status === 'DRAFT' && (
              <Button
                onClick={() => handleAction(sendProposal)}
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar Propuesta
              </Button>
            )}
            {proposal.status === 'SENT' && (
              <>
                <Button
                  onClick={() => handleAction(acceptProposal)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aceptar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction(rejectProposal)}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/crm/propuestas')}
            >
              Volver a Lista
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lineas de la Propuesta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposal.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(line.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(proposal.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ITBIS (18%):</span>
                <span>{formatCurrency(proposal.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(proposal.totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
