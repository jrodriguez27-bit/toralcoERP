'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DataTable, Column } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { deleteEmployee } from './_actions'
import { Pencil, Trash2 } from 'lucide-react'

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  ADMINISTRATIVE: 'Administrativo',
  FIELD_WORKER: 'Obrero',
  TECHNICIAN: 'Técnico',
  MANAGER: 'Gerente',
}

interface EmployeeRow {
  id: string
  code: string
  firstName: string
  lastName: string
  cedula: string
  position: string
  employeeType: string
  baseSalary: string
  isActive: boolean
  projectName: string | null
}

interface EmployeesTableProps {
  data: EmployeeRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function EmployeesTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sortBy,
  sortDir,
}: EmployeesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      await deleteEmployee(deleteId)
      setDeleteId(null)
    })
  }

  const columns: Column<EmployeeRow>[] = [
    { key: 'code', label: 'Código', sortable: true },
    {
      key: 'name',
      label: 'Nombre',
      sortable: false,
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { key: 'cedula', label: 'Cédula', sortable: true },
    { key: 'position', label: 'Cargo', sortable: true },
    {
      key: 'employeeType',
      label: 'Tipo',
      sortable: true,
      render: (row) => EMPLOYEE_TYPE_LABELS[row.employeeType] || row.employeeType,
    },
    {
      key: 'baseSalary',
      label: 'Salario Base',
      sortable: true,
      className: 'text-right',
      render: (row) => formatCurrency(row.baseSalary),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'destructive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/nomina/empleados/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        searchPlaceholder="Buscar empleados..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Empleado"
        description="¿Está seguro que desea eliminar este empleado? Esta acción se puede revertir."
        confirmLabel={isPending ? 'Eliminando...' : 'Eliminar'}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
