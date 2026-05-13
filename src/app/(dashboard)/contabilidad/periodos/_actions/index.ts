'use server'

import { prisma } from '@/lib/prisma'
import { accountingPeriodSchema } from '@/lib/validations/contabilidad'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createPeriod(data: { year: number; month: number }) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = accountingPeriodSchema.parse(data)

  // Check if period already exists
  const existing = await prisma.accountingPeriod.findUnique({
    where: { year_month: { year: validated.year, month: validated.month } },
  })

  if (existing) {
    throw new Error(`El período ${validated.month}/${validated.year} ya existe`)
  }

  const startDate = new Date(validated.year, validated.month - 1, 1)
  const endDate = new Date(validated.year, validated.month, 0)
  const name = `${startDate.toLocaleString('es-DO', { month: 'long' })} ${validated.year}`

  const period = await prisma.accountingPeriod.create({
    data: {
      name,
      startDate,
      endDate,
      year: validated.year,
      month: validated.month,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'AccountingPeriod',
    entityId: period.id,
  })

  revalidatePath('/contabilidad/periodos')
  return { success: true, id: period.id }
}

export async function closePeriod(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const period = await prisma.accountingPeriod.findUnique({
    where: { id },
  })

  if (!period) throw new Error('Período no encontrado')
  if (period.isClosed) throw new Error('El período ya está cerrado')

  // Check for draft journal entries in this period
  const draftCount = await prisma.journalEntry.count({
    where: { periodId: id, status: 'DRAFT' },
  })

  if (draftCount > 0) {
    throw new Error(`No se puede cerrar el período. Hay ${draftCount} asiento(s) en borrador.`)
  }

  await prisma.accountingPeriod.update({
    where: { id },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedBy: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CLOSE',
    entity: 'AccountingPeriod',
    entityId: id,
  })

  revalidatePath('/contabilidad/periodos')
  return { success: true }
}

export async function reopenPeriod(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Admin only check
  if ((session.user as any).role !== 'ADMIN') {
    throw new Error('Solo administradores pueden reabrir períodos')
  }

  const period = await prisma.accountingPeriod.findUnique({
    where: { id },
  })

  if (!period) throw new Error('Período no encontrado')
  if (!period.isClosed) throw new Error('El período no está cerrado')

  await prisma.accountingPeriod.update({
    where: { id },
    data: {
      isClosed: false,
      closedAt: null,
      closedBy: null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'REOPEN',
    entity: 'AccountingPeriod',
    entityId: id,
  })

  revalidatePath('/contabilidad/periodos')
  return { success: true }
}
