'use server'

import { prisma } from '@/lib/prisma'
import { costCodeSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createCostCode(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = costCodeSchema.parse({
    ...raw,
    accountId: raw.accountId || null,
  })

  const costCode = await prisma.costCode.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      accountId: data.accountId || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'CostCode',
    entityId: costCode.id,
  })

  revalidatePath('/catalogos/codigos-costo')
  return { success: true, id: costCode.id }
}

export async function updateCostCode(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = costCodeSchema.parse({
    ...raw,
    accountId: raw.accountId || null,
  })

  await prisma.costCode.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      accountId: data.accountId || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'CostCode',
    entityId: id,
  })

  revalidatePath('/catalogos/codigos-costo')
  return { success: true }
}

export async function deleteCostCode(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.costCode.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'CostCode',
    entityId: id,
  })

  revalidatePath('/catalogos/codigos-costo')
  return { success: true }
}
