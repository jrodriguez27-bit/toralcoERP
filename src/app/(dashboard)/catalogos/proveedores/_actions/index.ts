'use server'

import { prisma } from '@/lib/prisma'
import { supplierSchema } from '@/lib/validations/catalogos'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createSupplier(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = supplierSchema.parse({
    ...raw,
    paymentTermDays: Number(raw.paymentTermDays) || 30,
  })

  const supplier = await prisma.supplier.create({
    data: {
      code: data.code,
      name: data.name,
      rnc: data.rnc || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      paymentTermDays: data.paymentTermDays,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Supplier',
    entityId: supplier.id,
  })

  revalidatePath('/catalogos/proveedores')
  return { success: true, id: supplier.id }
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = supplierSchema.parse({
    ...raw,
    paymentTermDays: Number(raw.paymentTermDays) || 30,
  })

  await prisma.supplier.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      rnc: data.rnc || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      paymentTermDays: data.paymentTermDays,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Supplier',
    entityId: id,
  })

  revalidatePath('/catalogos/proveedores')
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.supplier.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Supplier',
    entityId: id,
  })

  revalidatePath('/catalogos/proveedores')
  return { success: true }
}
