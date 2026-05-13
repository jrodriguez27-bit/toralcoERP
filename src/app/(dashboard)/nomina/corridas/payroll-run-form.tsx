'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createPayrollRun } from './_actions'
import { Loader2 } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
]

export function PayrollRunForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createPayrollRun(formData)
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Corrida de Nómina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Fecha Inicio *</Label>
                <Input id="periodStart" name="periodStart" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Fecha Fin *</Label>
                <Input id="periodEnd" name="periodEnd" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <input type="hidden" name="type" id="type-hidden" defaultValue="MONTHLY" />
                <EntitySelect
                  value="MONTHLY"
                  onValueChange={(val) => {
                    const el = document.getElementById('type-hidden') as HTMLInputElement
                    if (el) el.value = val
                  }}
                  options={TYPE_OPTIONS}
                  placeholder="Seleccionar tipo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Observaciones opcionales..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Corrida
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/nomina/corridas')}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  )
}
