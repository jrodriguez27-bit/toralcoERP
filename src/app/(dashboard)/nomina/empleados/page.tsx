import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { EmployeesTable } from './employees-table'

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { cedula: { contains: search, mode: 'insensitive' as const } },
            { position: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [employees, totalCount] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { project: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ])

  const serialized = employees.map((e) => ({
    ...e,
    baseSalary: e.baseSalary.toString(),
    birthDate: e.birthDate?.toISOString() ?? null,
    hireDate: e.hireDate.toISOString(),
    terminationDate: e.terminationDate?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt?.toISOString() ?? null,
    projectName: e.project?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empleados"
        description="Gestión de empleados"
        createHref="/nomina/empleados/nuevo"
        createLabel="Nuevo Empleado"
      />
      <EmployeesTable
        data={serialized}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir as 'asc' | 'desc'}
      />
    </div>
  )
}
