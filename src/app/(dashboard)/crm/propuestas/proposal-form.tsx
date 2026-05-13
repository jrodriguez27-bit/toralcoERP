'use client'

import { useRouter } from 'next/navigation'
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
import { createProposal, updateProposal } from './_actions'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Decimal from 'decimal.js'

interface LineData {
  description: string
  quantity: string
  unitPrice: string
}

interface Props {
  proposal?: {
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
  leads: { value: string; label: string }[]
  defaultLeadId?: string
}

export function ProposalForm({ proposal, leads, defaultLeadId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leadId, setLeadId] = useState(proposal?.leadId || defaultLeadId || '')
  const [title, setTitle] = useState(proposal?.title || '')
  const [validUntil, setValidUntil] = useState(proposal?.validUntil || '')
  const [notes, setNotes] = useState(proposal?.notes || '')
  const isEditing = !!proposal
  const isDraft = !proposal || proposal.status === 'DRAFT'

  const [lines, setLines] = useState<LineData[]>(
    proposal?.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })) || [{ description: '', quantity: '1', unitPrice: '' }]
  )

  const addLine = () => {
    setLines([...lines, { description: '', quantity: '1', unitPrice: '' }])
  }

  const removeLine = (index: number) => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: keyof LineData, value: string) => {
    const updated = [...lines]
    updated[index] = { ...updated[index], [field]: value }
    setLines(updated)
  }

  const computeLineTotal = (line: LineData): string => {
    try {
      if (!line.quantity || !line.unitPrice) return '0'
      return new Decimal(line.quantity).times(new Decimal(line.unitPrice)).toString()
    } catch {
      return '0'
    }
  }

  const computeSubtotal = (): Decimal => {
    return lines.reduce((acc, line) => {
      try {
        if (!line.quantity || !line.unitPrice) return acc
        return acc.plus(new Decimal(line.quantity).times(new Decimal(line.unitPrice)))
      } catch {
        return acc
      }
    }, new Decimal(0))
  }

  const subtotal = computeSubtotal()
  const taxAmount = subtotal.times(new Decimal('0.18'))
  const totalAmount = subtotal.plus(taxAmount)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        leadId,
        title,
        validUntil: validUntil || null,
        notes: notes || null,
        lines: lines.filter((l) => l.description && l.quantity && l.unitPrice),
      }

      if (payload.lines.length === 0) {
        setError('Debe agregar al menos una linea con descripcion, cantidad y precio')
        setLoading(false)
        return
      }

      if (isEditing) {
        await updateProposal(proposal.id, payload)
        router.refresh()
      } else {
        const result = await createProposal(payload)
        router.push(`/crm/propuestas/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? `Propuesta ${proposal.number}` : 'Nueva Propuesta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Lead *</Label>
                <EntitySelect
                  value={leadId}
                  onValueChange={setLeadId}
                  options={leads}
                  placeholder="Seleccionar lead..."
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isDraft}
                  placeholder="Titulo de la propuesta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valida Hasta</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  disabled={!isDraft}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  disabled={!isDraft}
                  placeholder="Notas o condiciones..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lineas de la Propuesta</CardTitle>
            {isDraft && (
              <Button size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Linea
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Descripcion</TableHead>
                  <TableHead className="w-32 text-right">Cantidad</TableHead>
                  <TableHead className="w-40 text-right">Precio Unitario</TableHead>
                  <TableHead className="w-40 text-right">Total</TableHead>
                  {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {isDraft ? (
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Descripcion del servicio o producto"
                        />
                      ) : (
                        line.description
                      )}
                    </TableCell>
                    <TableCell>
                      {isDraft ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                          className="text-right"
                        />
                      ) : (
                        <span className="text-right block">{line.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isDraft ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                          className="text-right"
                        />
                      ) : (
                        <span className="text-right block">{formatCurrency(line.unitPrice)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(computeLineTotal(line))}
                    </TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal.toString())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ITBIS (18%):</span>
                <span>{formatCurrency(taxAmount.toString())}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount.toString())}</span>
              </div>
            </div>
          </div>

          {isDraft && (
            <div className="flex gap-3 pt-4 border-t mt-4">
              <Button onClick={handleSubmit} disabled={loading || !leadId || !title}>
                {loading ? 'Guardando...' : isEditing ? 'Actualizar Propuesta' : 'Crear Propuesta'}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
