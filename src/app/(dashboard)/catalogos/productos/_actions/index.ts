'use server'

import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = productSchema.parse(raw)

  const product = await prisma.product.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      unit: data.unit,
      category: data.category || null,
      minStock: data.minStock ? parseFloat(data.minStock) : 0,
      maxStock: data.maxStock ? parseFloat(data.maxStock) : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Product',
    entityId: product.id,
  })

  revalidatePath('/catalogos/productos')
  return { success: true, id: product.id }
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = productSchema.parse(raw)

  await prisma.product.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      unit: data.unit,
      category: data.category || null,
      minStock: data.minStock ? parseFloat(data.minStock) : 0,
      maxStock: data.maxStock ? parseFloat(data.maxStock) : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Product',
    entityId: id,
  })

  revalidatePath('/catalogos/productos')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Product',
    entityId: id,
  })

  revalidatePath('/catalogos/productos')
  return { success: true }
}
