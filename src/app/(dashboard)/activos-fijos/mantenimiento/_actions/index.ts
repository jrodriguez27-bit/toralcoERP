'use server'

import { prisma } from '@/lib/prisma'
import { maintenanceSchema } from '@/lib/validations/activos-fijos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createMaintenance(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = maintenanceSchema.parse(raw)

  const maintenance = await prisma.assetMaintenance.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      description: data.description,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      cost: data.cost || '0',
      vendor: data.vendor || null,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'AssetMaintenance',
    entityId: maintenance.id,
  })

  revalidatePath('/activos-fijos/mantenimiento')
  return { success: true, id: maintenance.id }
}

export async function updateMaintenance(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = maintenanceSchema.parse(raw)

  const existing = await prisma.assetMaintenance.findUnique({ where: { id } })
  if (!existing) throw new Error('Mantenimiento no encontrado')
  if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
    throw new Error('No se puede editar un mantenimiento completado o cancelado')
  }

  await prisma.assetMaintenance.update({
    where: { id },
    data: {
      assetId: data.assetId,
      type: data.type,
      description: data.description,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      cost: data.cost || '0',
      vendor: data.vendor || null,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'AssetMaintenance',
    entityId: id,
  })

  revalidatePath('/activos-fijos/mantenimiento')
  return { success: true }
}

export async function completeMaintenance(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.assetMaintenance.findUnique({ where: { id } })
  if (!existing) throw new Error('Mantenimiento no encontrado')
  if (existing.status === 'COMPLETED') throw new Error('Ya esta completado')
  if (existing.status === 'CANCELLED') throw new Error('Esta cancelado')

  await prisma.assetMaintenance.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'COMPLETE',
    entity: 'AssetMaintenance',
    entityId: id,
  })

  revalidatePath('/activos-fijos/mantenimiento')
  return { success: true }
}

export async function cancelMaintenance(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.assetMaintenance.findUnique({ where: { id } })
  if (!existing) throw new Error('Mantenimiento no encontrado')
  if (existing.status === 'COMPLETED') throw new Error('No se puede cancelar un mantenimiento completado')
  if (existing.status === 'CANCELLED') throw new Error('Ya esta cancelado')

  await prisma.assetMaintenance.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CANCEL',
    entity: 'AssetMaintenance',
    entityId: id,
  })

  revalidatePath('/activos-fijos/mantenimiento')
  return { success: true }
}

export async function startMaintenance(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.assetMaintenance.findUnique({ where: { id } })
  if (!existing) throw new Error('Mantenimiento no encontrado')
  if (existing.status !== 'SCHEDULED') throw new Error('Solo se puede iniciar un mantenimiento programado')

  await prisma.assetMaintenance.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'START',
    entity: 'AssetMaintenance',
    entityId: id,
  })

  revalidatePath('/activos-fijos/mantenimiento')
  return { success: true }
}
