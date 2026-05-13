import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { EmployeeForm } from '../employee-form'

export default async function NuevoEmpleadoPage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'COMPLETED' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }))

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo Empleado" description="Registrar un nuevo empleado" />
      <EmployeeForm projects={projectOptions} />
    </div>
  )
}
