import { prisma } from '@/lib/prisma'
import { ProjectForm } from '../project-form'

export default async function NewProjectPage() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <div className="space-y-6">
      <ProjectForm clients={clientOptions} />
    </div>
  )
}
