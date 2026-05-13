'use server'

import { prisma } from '@/lib/prisma'
import { requisitionSchema, requisitionLineSchema } from '@/lib/validations/compras'
import { logAudit } from '@/lib/services/audit.service'
import { checkBudgetAvailability, type BudgetCheckResult } from '@/lib/services/budget.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

export async function createRequisition(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = requisitionSchema.parse(raw)

  const number = await generateSequentialNumber(prisma, 'REQUISITION', 'REQ')

  const requisition = await prisma.requisition.create({
    data: {
      number,
      projectId: data.projectId,
      description: data.description || null,
      notes: data.notes || null,
      requestedBy: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Requisition',
    entityId: requisition.id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true, id: requisition.id }
}

export async function updateRequisition(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = requisitionSchema.parse(raw)

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) throw new Error('Requisicion no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar requisiciones en borrador')
  }

  await prisma.requisition.update({
    where: { id },
    data: {
      projectId: data.projectId,
      description: data.description || null,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Requisition',
    entityId: id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function deleteRequisition(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) throw new Error('Requisicion no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar requisiciones en borrador')
  }

  await prisma.requisition.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Requisition',
    entityId: id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function addRequisitionLine(
  requisitionId: string,
  data: {
    productId: string
    costCodeId?: string | null
    description?: string | null
    quantity: string
    estimatedCost: string
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = requisitionLineSchema.parse(data)

  const requisition = await prisma.requisition.findUnique({ where: { id: requisitionId } })
  if (!requisition) throw new Error('Requisicion no encontrada')
  if (requisition.status !== 'DRAFT') {
    throw new Error('Solo se pueden agregar lineas a requisiciones en borrador')
  }

  const quantity = new Decimal(validated.quantity)
  const estimatedCost = new Decimal(validated.estimatedCost || '0')

  // Check budget availability if costCodeId is provided
  let budgetCheck: BudgetCheckResult | null = null
  if (validated.costCodeId) {
    const totalEstimated = quantity.times(estimatedCost)
    budgetCheck = await checkBudgetAvailability(
      requisition.projectId,
      validated.costCodeId,
      totalEstimated.toString()
    )
  }

  const line = await prisma.requisitionLine.create({
    data: {
      requisitionId,
      productId: validated.productId,
      costCodeId: validated.costCodeId || null,
      description: validated.description || null,
      quantity,
      estimatedCost,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'ADD_LINE',
    entity: 'RequisitionLine',
    entityId: line.id,
    metadata: { requisitionId },
  })

  revalidatePath('/compras/requisiciones')
  return { success: true, id: line.id, budgetCheck }
}

export async function removeRequisitionLine(lineId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.requisitionLine.findUnique({
    where: { id: lineId },
    include: { requisition: true },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (existing.requisition.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar lineas de requisiciones en borrador')
  }

  await prisma.requisitionLine.delete({ where: { id: lineId } })

  await logAudit({
    userId: session.user.id,
    action: 'REMOVE_LINE',
    entity: 'RequisitionLine',
    entityId: lineId,
    metadata: { requisitionId: existing.requisitionId },
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function submitRequisition(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.requisition.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!existing) throw new Error('Requisicion no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden enviar a aprobacion requisiciones en borrador')
  }
  if (existing.lines.length === 0) {
    throw new Error('La requisicion debe tener al menos una linea')
  }

  await prisma.requisition.update({
    where: { id },
    data: { status: 'PENDING_APPROVAL' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'SUBMIT_APPROVAL',
    entity: 'Requisition',
    entityId: id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function approveRequisition(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) throw new Error('Requisicion no encontrada')
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error('Solo se pueden aprobar requisiciones pendientes de aprobacion')
  }

  await prisma.requisition.update({
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
    entity: 'Requisition',
    entityId: id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function rejectRequisition(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.requisition.findUnique({ where: { id } })
  if (!existing) throw new Error('Requisicion no encontrada')
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error('Solo se pueden rechazar requisiciones pendientes de aprobacion')
  }

  await prisma.requisition.update({
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
    entity: 'Requisition',
    entityId: id,
  })

  revalidatePath('/compras/requisiciones')
  return { success: true }
}

export async function checkLineBudget(
  projectId: string,
  costCodeId: string,
  estimatedTotal: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  return await checkBudgetAvailability(projectId, costCodeId, estimatedTotal)
}

export async function convertToOC(requisitionId: string, supplierId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { lines: { include: { product: true } } },
  })

  if (!requisition) throw new Error('Requisicion no encontrada')
  if (requisition.status !== 'APPROVED' && requisition.status !== 'PARTIALLY_CONVERTED') {
    throw new Error('Solo se pueden convertir requisiciones aprobadas')
  }

  // Get lines that haven't been fully converted
  const unconvertedLines = requisition.lines.filter((line) => {
    const qty = new Decimal(line.quantity.toString())
    const converted = new Decimal(line.convertedQty.toString())
    return converted.lt(qty)
  })

  if (unconvertedLines.length === 0) {
    throw new Error('Todas las lineas ya fueron convertidas')
  }

  const ocNumber = await generateSequentialNumber(prisma, 'PURCHASE_ORDER', 'OC')

  // Calculate totals for the new OC
  let subtotal = new Decimal(0)
  let taxAmount = new Decimal(0)

  const ocLines = unconvertedLines.map((line) => {
    const remainingQty = new Decimal(line.quantity.toString()).minus(
      new Decimal(line.convertedQty.toString())
    )
    const unitPrice = new Decimal(line.estimatedCost.toString())
    const lineSubtotal = remainingQty.times(unitPrice)
    const taxRate = new Decimal('0.18')
    const lineTax = lineSubtotal.times(taxRate)
    const lineTotal = lineSubtotal.plus(lineTax)

    subtotal = subtotal.plus(lineSubtotal)
    taxAmount = taxAmount.plus(lineTax)

    return {
      productId: line.productId,
      costCodeId: line.costCodeId,
      description: line.description,
      quantity: remainingQty,
      unitPrice,
      taxRate,
      totalAmount: lineTotal,
    }
  })

  const totalAmount = subtotal.plus(taxAmount)

  const purchaseOrder = await prisma.$transaction(async (tx) => {
    // Create PO with lines
    const po = await tx.purchaseOrder.create({
      data: {
        number: ocNumber,
        requisitionId,
        supplierId,
        projectId: requisition.projectId,
        subtotal,
        taxAmount,
        totalAmount,
        lines: {
          create: ocLines,
        },
      },
    })

    // Update convertedQty on requisition lines
    for (const line of unconvertedLines) {
      const qty = new Decimal(line.quantity.toString())
      await tx.requisitionLine.update({
        where: { id: line.id },
        data: { convertedQty: qty },
      })
    }

    // Check if all lines are now fully converted
    const allLines = await tx.requisitionLine.findMany({
      where: { requisitionId },
    })
    const allConverted = allLines.every((l) => {
      const qty = new Decimal(l.quantity.toString())
      const converted = new Decimal(l.convertedQty.toString())
      return converted.gte(qty)
    })

    await tx.requisition.update({
      where: { id: requisitionId },
      data: {
        status: allConverted ? 'CONVERTED' : 'PARTIALLY_CONVERTED',
      },
    })

    return po
  })

  await logAudit({
    userId: session.user.id,
    action: 'CONVERT_TO_OC',
    entity: 'Requisition',
    entityId: requisitionId,
    metadata: { purchaseOrderId: purchaseOrder.id, ocNumber },
  })

  revalidatePath('/compras/requisiciones')
  revalidatePath('/compras/ordenes-compra')
  return { success: true, id: purchaseOrder.id }
}
