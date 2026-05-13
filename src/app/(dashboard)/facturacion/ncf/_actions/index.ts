'use server'

import { prisma } from '@/lib/prisma'
import { ncfSequenceSchema } from '@/lib/validations/facturacion'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createNcfSequence(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = ncfSequenceSchema.parse({
    ...raw,
    rangeFrom: Number(raw.rangeFrom),
    rangeTo: Number(raw.rangeTo),
  })

  if (data.rangeTo <= data.rangeFrom) {
    throw new Error('El rango final debe ser mayor al rango inicial')
  }

  const sequence = await prisma.ncfSequence.create({
    data: {
      type: data.type,
      prefix: data.prefix,
      currentNumber: 0,
      rangeFrom: data.rangeFrom,
      rangeTo: data.rangeTo,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'NcfSequence',
    entityId: sequence.id,
  })

  revalidatePath('/facturacion/ncf')
  return { success: true, id: sequence.id }
}

export async function updateNcfSequence(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = ncfSequenceSchema.parse({
    ...raw,
    rangeFrom: Number(raw.rangeFrom),
    rangeTo: Number(raw.rangeTo),
  })

  if (data.rangeTo <= data.rangeFrom) {
    throw new Error('El rango final debe ser mayor al rango inicial')
  }

  const existing = await prisma.ncfSequence.findUnique({ where: { id } })
  if (!existing) throw new Error('Secuencia no encontrada')

  if (data.rangeFrom > existing.currentNumber && existing.currentNumber > 0) {
    throw new Error('El rango inicial no puede ser mayor al numero actual')
  }

  await prisma.ncfSequence.update({
    where: { id },
    data: {
      type: data.type,
      prefix: data.prefix,
      rangeFrom: data.rangeFrom,
      rangeTo: data.rangeTo,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'NcfSequence',
    entityId: id,
  })

  revalidatePath('/facturacion/ncf')
  return { success: true }
}

export async function deleteNcfSequence(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.ncfSequence.findUnique({ where: { id } })
  if (!existing) throw new Error('Secuencia no encontrada')

  if (existing.currentNumber > 0) {
    throw new Error('No se puede eliminar una secuencia que ya ha sido utilizada')
  }

  await prisma.ncfSequence.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'NcfSequence',
    entityId: id,
  })

  revalidatePath('/facturacion/ncf')
  return { success: true }
}

export async function toggleNcfActive(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.ncfSequence.findUnique({ where: { id } })
  if (!existing) throw new Error('Secuencia no encontrada')

  await prisma.ncfSequence.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  await logAudit({
    userId: session.user.id,
    action: existing.isActive ? 'DEACTIVATE' : 'ACTIVATE',
    entity: 'NcfSequence',
    entityId: id,
  })

  revalidatePath('/facturacion/ncf')
  return { success: true }
}
