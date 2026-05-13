import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { ProjectsTable } from './projects-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [projects, totalCount] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { client: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])

  const serializedProjects = projects.map((p) => ({
    ...p,
    startDate: p.startDate?.toISOString() || null,
    endDate: p.endDate?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() || null,
    client: p.client
      ? {
          id: p.client.id,
          name: p.client.name,
        }
      : null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        description="Gestión de proyectos"
        createHref="/catalogos/proyectos/nuevo"
        createLabel="Nuevo Proyecto"
      />
      <ProjectsTable
        data={serializedProjects}
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
