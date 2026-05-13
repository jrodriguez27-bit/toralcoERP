'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createJournalEntryAction } from './_actions'
import { Plus, Trash2 } from 'lucide-react'
import Decimal from 'decimal.js'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

interface LineItem {
  id: string
  accountId: string
  description: string
  debit: string
  credit: string
}

interface Props {
  accounts: { value: string; label: string }[]
}

function generateLineId() {
  return Math.random().toString(36).substring(2, 9)
}

function emptyLine(): LineItem {
  return {
    id: generateLineId(),
    accountId: '',
    description: '',
    debit: '',
    credit: '',
  }
}

export function JournalEntryForm({ accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([emptyLine(), emptyLine()])

  const addLine = () => {
    setLines([...lines, emptyLine()])
  }

  const removeLine = (id: string) => {
    if (lines.length <= 2) return
    setLines(lines.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, field: keyof LineItem, value: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const totalDebit = lines.reduce((sum, l) => {
    try {
      return sum.plus(new Decimal(l.debit || '0'))
    } catch {
      return sum
    }
  }, new Decimal(0))

  const totalCredit = lines.reduce((sum, l) => {
    try {
      return sum.plus(new Decimal(l.credit || '0'))
    } catch {
      return sum
    }
  }, new Decimal(0))

  const isBalanced = totalDebit.eq(totalCredit)
  const hasAmount = totalDebit.gt(0) || totalCredit.gt(0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await createJournalEntryAction({
        date,
        description,
        reference: reference || null,
        notes: notes || null,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || null,
          debit: l.debit || '0',
          credit: l.credit || '0',
        })),
      })
      router.push(`/contabilidad/asientos/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear asiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Asiento Contable</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Documento de referencia"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripcion *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripcion del asiento"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lineas del Asiento</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Linea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Cuenta *</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="w-40 text-right">Debito</TableHead>
                  <TableHead className="w-40 text-right">Credito</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <EntitySelect
                        value={line.accountId}
                        onValueChange={(val) => updateLine(line.id, 'accountId', val)}
                        options={accounts}
                        placeholder="Seleccionar cuenta..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder="Descripcion"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-right"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">
                    Totales
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      hasAmount && !isBalanced ? 'text-red-600' : ''
                    }`}
                  >
                    {totalDebit.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      hasAmount && !isBalanced ? 'text-red-600' : ''
                    }`}
                  >
                    {totalCredit.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {hasAmount && !isBalanced && (
            <p className="mt-2 text-sm text-red-600">
              El asiento esta desbalanceado. La diferencia es de{' '}
              {totalDebit.minus(totalCredit).abs().toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || (hasAmount && !isBalanced)}>
          {loading ? 'Guardando...' : 'Crear Asiento'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
