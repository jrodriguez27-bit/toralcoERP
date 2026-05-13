'use server'

import { prisma } from '@/lib/prisma'
import { warehouseSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createWarehouse(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = warehouseSchema.parse(raw)

  const warehouse = await prisma.warehouse.create({
    data: {
      code: data.code,
      name: data.name,
      address: data.address || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Warehouse',
    entityId: warehouse.id,
  })

  revalidatePath('/catalogos/almacenes')
  return { success: true, id: warehouse.id }
}

export async function updateWarehouse(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = warehouseSchema.parse(raw)

  await prisma.warehouse.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      address: data.address || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Warehouse',
    entityId: id,
  })

  revalidatePath('/catalogos/almacenes')
  return { success: true }
}

export async function deleteWarehouse(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.warehouse.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Warehouse',
    entityId: id,
  })

  revalidatePath('/catalogos/almacenes')
  return { success: true }
}
