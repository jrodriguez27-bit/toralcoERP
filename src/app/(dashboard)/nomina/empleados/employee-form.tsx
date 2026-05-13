'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createEmployee, updateEmployee } from './_actions'
import { Loader2 } from 'lucide-react'

const EMPLOYEE_TYPE_OPTIONS = [
  { value: 'ADMINISTRATIVE', label: 'Administrativo' },
  { value: 'FIELD_WORKER', label: 'Obrero' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'MANAGER', label: 'Gerente' },
]

interface EmployeeFormProps {
  employee?: {
    id: string
    code: string
    firstName: string
    lastName: string
    cedula: string
    birthDate: string | null
    hireDate: string
    department: string | null
    position: string
    projectId: string | null
    employeeType: string
    baseSalary: string
    bankAccount: string | null
    bankName: string | null
  }
  projects: { value: string; label: string }[]
}

export function EmployeeForm({ employee, projects }: EmployeeFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEditing = !!employee

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (isEditing) {
        await updateEmployee(employee.id, formData)
      } else {
        await createEmployee(formData)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input id="code" name="code" required defaultValue={employee?.code ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input id="firstName" name="firstName" required defaultValue={employee?.firstName ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input id="lastName" name="lastName" required defaultValue={employee?.lastName ?? ''} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula *</Label>
                <Input id="cedula" name="cedula" required defaultValue={employee?.cedula ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={employee?.birthDate ? employee.birthDate.split('T')[0] : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Fecha de Ingreso *</Label>
                <Input
                  id="hireDate"
                  name="hireDate"
                  type="date"
                  required
                  defaultValue={employee?.hireDate ? employee.hireDate.split('T')[0] : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Input id="position" name="position" required defaultValue={employee?.position ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" name="department" defaultValue={employee?.department ?? ''} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Empleado</Label>
                <input type="hidden" name="employeeType" id="employeeType-hidden" defaultValue={employee?.employeeType ?? 'ADMINISTRATIVE'} />
                <EntitySelect
                  value={employee?.employeeType ?? 'ADMINISTRATIVE'}
                  onValueChange={(val) => {
                    const el = document.getElementById('employeeType-hidden') as HTMLInputElement
                    if (el) el.value = val
                  }}
                  options={EMPLOYEE_TYPE_OPTIONS}
                  placeholder="Seleccionar tipo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Salario Base (RD$) *</Label>
                <Input
                  id="baseSalary"
                  name="baseSalary"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={employee?.baseSalary ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <input type="hidden" name="projectId" id="projectId-hidden" defaultValue={employee?.projectId ?? ''} />
                <EntitySelect
                  value={employee?.projectId ?? ''}
                  onValueChange={(val) => {
                    const el = document.getElementById('projectId-hidden') as HTMLInputElement
                    if (el) el.value = val
                  }}
                  options={[{ value: '', label: 'Sin proyecto' }, ...projects]}
                  placeholder="Seleccionar proyecto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Banco</Label>
                <Input id="bankName" name="bankName" defaultValue={employee?.bankName ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
                <Input id="bankAccount" name="bankAccount" defaultValue={employee?.bankAccount ?? ''} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Actualizar' : 'Crear Empleado'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/nomina/empleados')}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  )
}
