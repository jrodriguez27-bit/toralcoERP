import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProjectForm } from '../project-form'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, clients] = await Promise.all([
    prisma.project.findUnique({ where: { id: params.id } }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!project) notFound()

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <div className="space-y-6">
      <ProjectForm
        project={{
          ...project,
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null,
        }}
        clients={clientOptions}
      />
    </div>
  )
}
