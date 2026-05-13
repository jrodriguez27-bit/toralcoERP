'use server'

import { prisma } from '@/lib/prisma'
import { projectSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = projectSchema.parse(raw)

  const project = await prisma.project.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      clientId: data.clientId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Project',
    entityId: project.id,
  })

  revalidatePath('/catalogos/proyectos')
  return { success: true, id: project.id }
}

export async function updateProject(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = projectSchema.parse(raw)

  await prisma.project.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      clientId: data.clientId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Project',
    entityId: id,
  })

  revalidatePath('/catalogos/proyectos')
  return { success: true }
}

export async function deleteProject(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Project',
    entityId: id,
  })

  revalidatePath('/catalogos/proyectos')
  return { success: true }
}
