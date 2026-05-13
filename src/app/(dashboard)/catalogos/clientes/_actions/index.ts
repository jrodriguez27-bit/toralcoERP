'use server'

import { prisma } from '@/lib/prisma'
import { clientSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createClient(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = clientSchema.parse({
    ...raw,
    creditDays: Number(raw.creditDays) || 30,
  })

  const client = await prisma.client.create({
    data: {
      code: data.code,
      name: data.name,
      rnc: data.rnc || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      creditLimit: data.creditLimit ? data.creditLimit : null,
      creditDays: data.creditDays,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Client',
    entityId: client.id,
  })

  revalidatePath('/catalogos/clientes')
  return { success: true, id: client.id }
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = clientSchema.parse({
    ...raw,
    creditDays: Number(raw.creditDays) || 30,
  })

  await prisma.client.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      rnc: data.rnc || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      creditLimit: data.creditLimit ? data.creditLimit : null,
      creditDays: data.creditDays,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Client',
    entityId: id,
  })

  revalidatePath('/catalogos/clientes')
  return { success: true }
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Client',
    entityId: id,
  })

  revalidatePath('/catalogos/clientes')
  return { success: true }
}
