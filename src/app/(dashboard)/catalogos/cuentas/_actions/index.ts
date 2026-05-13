'use server'

import { prisma } from '@/lib/prisma'
import { accountCatalogSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createAccount(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = accountCatalogSchema.parse({
    ...raw,
    level: Number(raw.level) || 1,
    acceptsEntries: raw.acceptsEntries === 'true' || raw.acceptsEntries === 'on',
    parentId: raw.parentId || null,
  })

  const account = await prisma.accountCatalog.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      nature: data.nature,
      parentId: data.parentId || null,
      level: data.level,
      acceptsEntries: data.acceptsEntries,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'AccountCatalog',
    entityId: account.id,
  })

  revalidatePath('/catalogos/cuentas')
  return { success: true, id: account.id }
}

export async function updateAccount(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = accountCatalogSchema.parse({
    ...raw,
    level: Number(raw.level) || 1,
    acceptsEntries: raw.acceptsEntries === 'true' || raw.acceptsEntries === 'on',
    parentId: raw.parentId || null,
  })

  await prisma.accountCatalog.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      nature: data.nature,
      parentId: data.parentId || null,
      level: data.level,
      acceptsEntries: data.acceptsEntries,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'AccountCatalog',
    entityId: id,
  })

  revalidatePath('/catalogos/cuentas')
  return { success: true }
}

export async function deleteAccount(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.accountCatalog.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'AccountCatalog',
    entityId: id,
  })

  revalidatePath('/catalogos/cuentas')
  return { success: true }
}
