import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { EmployeeForm } from '../employee-form'

export default async function EditarEmpleadoPage({
  params,
}: {
  params: { id: string }
}) {
  const [employee, projects] = await Promise.all([
    prisma.employee.findUnique({ where: { id: params.id } }),
    prisma.project.findMany({
      where: { status: { not: 'COMPLETED' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!employee || employee.deletedAt) notFound()

  const serialized = {
    id: employee.id,
    code: employee.code,
    firstName: employee.firstName,
    lastName: employee.lastName,
    cedula: employee.cedula,
    birthDate: employee.birthDate?.toISOString() ?? null,
    hireDate: employee.hireDate.toISOString(),
    department: employee.department,
    position: employee.position,
    projectId: employee.projectId,
    employeeType: employee.employeeType,
    baseSalary: employee.baseSalary.toString(),
    bankAccount: employee.bankAccount,
    bankName: employee.bankName,
  }

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }))

  return (
    <div className="space-y-6">
      <PageHeader title="Editar Empleado" description={`${employee.firstName} ${employee.lastName}`} />
      <EmployeeForm employee={serialized} projects={projectOptions} />
    </div>
  )
}
