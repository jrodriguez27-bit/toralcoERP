'use server'

import { prisma } from '@/lib/prisma'
import { budgetSchema, budgetLineSchema } from '@/lib/validations/presupuesto'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'

export async function createBudget(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = budgetSchema.parse(raw)

  const budget = await prisma.budget.create({
    data: {
      code: data.code,
      name: data.name,
      projectId: data.projectId,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Budget',
    entityId: budget.id,
  })

  revalidatePath('/presupuesto')
  return { success: true, id: budget.id }
}

export async function updateBudget(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = budgetSchema.parse(raw)

  const existing = await prisma.budget.findUnique({ where: { id } })
  if (!existing) throw new Error('Presupuesto no encontrado')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar presupuestos en borrador')
  }

  await prisma.budget.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      projectId: data.projectId,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Budget',
    entityId: id,
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function deleteBudget(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.budget.findUnique({ where: { id } })
  if (!existing) throw new Error('Presupuesto no encontrado')
  if (existing.status === 'APPROVED') {
    throw new Error('No se puede eliminar un presupuesto aprobado')
  }

  await prisma.budget.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Budget',
    entityId: id,
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function submitForApproval(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.budget.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!existing) throw new Error('Presupuesto no encontrado')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden enviar a aprobacion presupuestos en borrador')
  }
  if (existing.lines.length === 0) {
    throw new Error('El presupuesto debe tener al menos una linea')
  }

  await prisma.budget.update({
    where: { id },
    data: { status: 'PENDING_APPROVAL' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'SUBMIT_APPROVAL',
    entity: 'Budget',
    entityId: id,
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function approveBudget(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.budget.findUnique({ where: { id } })
  if (!existing) throw new Error('Presupuesto no encontrado')
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error('Solo se pueden aprobar presupuestos pendientes de aprobacion')
  }

  await prisma.budget.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'APPROVE',
    entity: 'Budget',
    entityId: id,
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function rejectBudget(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.budget.findUnique({ where: { id } })
  if (!existing) throw new Error('Presupuesto no encontrado')
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error('Solo se pueden rechazar presupuestos pendientes de aprobacion')
  }

  await prisma.budget.update({
    where: { id },
    data: {
      status: 'DRAFT',
      approvedBy: null,
      approvedAt: null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'REJECT',
    entity: 'Budget',
    entityId: id,
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function addBudgetLine(
  budgetId: string,
  data: {
    costCodeId: string
    accountId?: string | null
    description?: string | null
    quantity: string
    unitCost: string
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = budgetLineSchema.parse(data)

  const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
  if (!budget) throw new Error('Presupuesto no encontrado')
  if (budget.status !== 'DRAFT') {
    throw new Error('Solo se pueden agregar lineas a presupuestos en borrador')
  }

  const quantity = new Decimal(validated.quantity)
  const unitCost = new Decimal(validated.unitCost)
  const budgetedAmount = quantity.times(unitCost)

  const line = await prisma.budgetLine.create({
    data: {
      budgetId,
      costCodeId: validated.costCodeId,
      accountId: validated.accountId || null,
      description: validated.description || null,
      quantity,
      unitCost,
      budgetedAmount,
      availableAmount: budgetedAmount,
    },
  })

  // Recalculate budget totalAmount
  const aggregation = await prisma.budgetLine.aggregate({
    where: { budgetId },
    _sum: { budgetedAmount: true },
  })

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      totalAmount: aggregation._sum.budgetedAmount || 0,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'ADD_LINE',
    entity: 'BudgetLine',
    entityId: line.id,
    metadata: { budgetId },
  })

  revalidatePath('/presupuesto')
  return { success: true, id: line.id }
}

export async function updateBudgetLine(
  lineId: string,
  data: {
    costCodeId: string
    accountId?: string | null
    description?: string | null
    quantity: string
    unitCost: string
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = budgetLineSchema.parse(data)

  const existing = await prisma.budgetLine.findUnique({
    where: { id: lineId },
    include: { budget: true },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (existing.budget.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar lineas de presupuestos en borrador')
  }

  const quantity = new Decimal(validated.quantity)
  const unitCost = new Decimal(validated.unitCost)
  const budgetedAmount = quantity.times(unitCost)
  const committedAmount = new Decimal(existing.committedAmount.toString())
  const executedAmount = new Decimal(existing.executedAmount.toString())
  const availableAmount = budgetedAmount.minus(committedAmount).minus(executedAmount)

  await prisma.budgetLine.update({
    where: { id: lineId },
    data: {
      costCodeId: validated.costCodeId,
      accountId: validated.accountId || null,
      description: validated.description || null,
      quantity,
      unitCost,
      budgetedAmount,
      availableAmount,
    },
  })

  // Recalculate budget totalAmount
  const aggregation = await prisma.budgetLine.aggregate({
    where: { budgetId: existing.budgetId },
    _sum: { budgetedAmount: true },
  })

  await prisma.budget.update({
    where: { id: existing.budgetId },
    data: {
      totalAmount: aggregation._sum.budgetedAmount || 0,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE_LINE',
    entity: 'BudgetLine',
    entityId: lineId,
    metadata: { budgetId: existing.budgetId },
  })

  revalidatePath('/presupuesto')
  return { success: true }
}

export async function removeBudgetLine(lineId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.budgetLine.findUnique({
    where: { id: lineId },
    include: { budget: true },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (existing.budget.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar lineas de presupuestos en borrador')
  }

  const budgetId = existing.budgetId

  await prisma.budgetLine.delete({ where: { id: lineId } })

  // Recalculate budget totalAmount
  const aggregation = await prisma.budgetLine.aggregate({
    where: { budgetId },
    _sum: { budgetedAmount: true },
  })

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      totalAmount: aggregation._sum.budgetedAmount || 0,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'REMOVE_LINE',
    entity: 'BudgetLine',
    entityId: lineId,
    metadata: { budgetId },
  })

  revalidatePath('/presupuesto')
  return { success: true }
}
