'use server'

import { prisma } from '@/lib/prisma'
import { purchaseOrderSchema, purchaseOrderLineSchema } from '@/lib/validations/compras'
import { logAudit } from '@/lib/services/audit.service'
import { commitBudgetAmount } from '@/lib/services/budget.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

async function recalculateOrderTotals(orderId: string) {
  const lines = await prisma.purchaseOrderLine.findMany({
    where: { purchaseOrderId: orderId },
  })

  let subtotal = new Decimal(0)
  let taxAmount = new Decimal(0)

  for (const line of lines) {
    const qty = new Decimal(line.quantity.toString())
    const price = new Decimal(line.unitPrice.toString())
    const rate = new Decimal(line.taxRate.toString())
    const lineSubtotal = qty.times(price)
    const lineTax = lineSubtotal.times(rate)

    subtotal = subtotal.plus(lineSubtotal)
    taxAmount = taxAmount.plus(lineTax)
  }

  const totalAmount = subtotal.plus(taxAmount)

  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: {
      subtotal,
      taxAmount,
      totalAmount,
    },
  })
}

export async function createPurchaseOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = purchaseOrderSchema.parse({
    ...raw,
    paymentTermDays: Number(raw.paymentTermDays) || 30,
  })

  const number = await generateSequentialNumber(prisma, 'PURCHASE_ORDER', 'OC')

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      number,
      supplierId: data.supplierId,
      projectId: data.projectId,
      requisitionId: data.requisitionId || null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      paymentTermDays: data.paymentTermDays,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'PurchaseOrder',
    entityId: purchaseOrder.id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true, id: purchaseOrder.id }
}

export async function updatePurchaseOrder(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = purchaseOrderSchema.parse({
    ...raw,
    paymentTermDays: Number(raw.paymentTermDays) || 30,
  })

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar ordenes de compra en borrador')
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      supplierId: data.supplierId,
      projectId: data.projectId,
      requisitionId: data.requisitionId || null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      paymentTermDays: data.paymentTermDays,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'PurchaseOrder',
    entityId: id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function deletePurchaseOrder(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar ordenes de compra en borrador')
  }

  await prisma.purchaseOrder.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'PurchaseOrder',
    entityId: id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function addPOLine(
  orderId: string,
  data: {
    productId: string
    costCodeId?: string | null
    description?: string | null
    quantity: string
    unitPrice: string
    taxRate: string
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = purchaseOrderLineSchema.parse(data)

  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Orden de compra no encontrada')
  if (order.status !== 'DRAFT') {
    throw new Error('Solo se pueden agregar lineas a ordenes en borrador')
  }

  const quantity = new Decimal(validated.quantity)
  const unitPrice = new Decimal(validated.unitPrice)
  const taxRate = new Decimal(validated.taxRate)
  const lineSubtotal = quantity.times(unitPrice)
  const lineTax = lineSubtotal.times(taxRate)
  const totalAmount = lineSubtotal.plus(lineTax)

  const line = await prisma.purchaseOrderLine.create({
    data: {
      purchaseOrderId: orderId,
      productId: validated.productId,
      costCodeId: validated.costCodeId || null,
      description: validated.description || null,
      quantity,
      unitPrice,
      taxRate,
      totalAmount,
    },
  })

  await recalculateOrderTotals(orderId)

  await logAudit({
    userId: session.user.id,
    action: 'ADD_LINE',
    entity: 'PurchaseOrderLine',
    entityId: line.id,
    metadata: { orderId },
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true, id: line.id }
}

export async function updatePOLine(
  lineId: string,
  data: {
    productId: string
    costCodeId?: string | null
    description?: string | null
    quantity: string
    unitPrice: string
    taxRate: string
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = purchaseOrderLineSchema.parse(data)

  const existing = await prisma.purchaseOrderLine.findUnique({
    where: { id: lineId },
    include: { purchaseOrder: true },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (existing.purchaseOrder.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar lineas de ordenes en borrador')
  }

  const quantity = new Decimal(validated.quantity)
  const unitPrice = new Decimal(validated.unitPrice)
  const taxRate = new Decimal(validated.taxRate)
  const lineSubtotal = quantity.times(unitPrice)
  const lineTax = lineSubtotal.times(taxRate)
  const totalAmount = lineSubtotal.plus(lineTax)

  await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: {
      productId: validated.productId,
      costCodeId: validated.costCodeId || null,
      description: validated.description || null,
      quantity,
      unitPrice,
      taxRate,
      totalAmount,
    },
  })

  await recalculateOrderTotals(existing.purchaseOrderId)

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE_LINE',
    entity: 'PurchaseOrderLine',
    entityId: lineId,
    metadata: { orderId: existing.purchaseOrderId },
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function removePOLine(lineId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrderLine.findUnique({
    where: { id: lineId },
    include: { purchaseOrder: true },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (existing.purchaseOrder.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar lineas de ordenes en borrador')
  }

  const orderId = existing.purchaseOrderId

  await prisma.purchaseOrderLine.delete({ where: { id: lineId } })

  await recalculateOrderTotals(orderId)

  await logAudit({
    userId: session.user.id,
    action: 'REMOVE_LINE',
    entity: 'PurchaseOrderLine',
    entityId: lineId,
    metadata: { orderId },
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function submitPO(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden enviar a aprobacion ordenes en borrador')
  }
  if (existing.lines.length === 0) {
    throw new Error('La orden de compra debe tener al menos una linea')
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'PENDING_APPROVAL' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'SUBMIT_APPROVAL',
    entity: 'PurchaseOrder',
    entityId: id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function approvePO(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new Error('Solo se pueden aprobar ordenes pendientes de aprobacion')
  }

  // Commit budget amounts for lines with costCodeId
  for (const line of existing.lines) {
    if (line.costCodeId) {
      const lineSubtotal = new Decimal(line.quantity.toString()).times(
        new Decimal(line.unitPrice.toString())
      )
      try {
        await commitBudgetAmount(existing.projectId, line.costCodeId, lineSubtotal.toString())
      } catch {
        // Budget commitment is best-effort - log but don't block approval
      }
    }
  }

  await prisma.purchaseOrder.update({
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
    entity: 'PurchaseOrder',
    entityId: id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function cancelPO(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Orden de compra no encontrada')
  if (existing.status === 'RECEIVED' || existing.status === 'CANCELLED') {
    throw new Error('No se puede cancelar esta orden de compra')
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CANCEL',
    entity: 'PurchaseOrder',
    entityId: id,
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}

export async function receiveItems(lineId: string, receivedQty: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.purchaseOrderLine.findUnique({
    where: { id: lineId },
    include: { purchaseOrder: { include: { lines: true } } },
  })
  if (!existing) throw new Error('Linea no encontrada')
  if (
    existing.purchaseOrder.status !== 'APPROVED' &&
    existing.purchaseOrder.status !== 'PARTIALLY_RECEIVED'
  ) {
    throw new Error('Solo se pueden recibir items de ordenes aprobadas')
  }

  const newReceivedQty = new Decimal(receivedQty)
  const maxQty = new Decimal(existing.quantity.toString())

  if (newReceivedQty.gt(maxQty)) {
    throw new Error('La cantidad recibida no puede exceder la cantidad ordenada')
  }

  if (newReceivedQty.lt(0)) {
    throw new Error('La cantidad recibida no puede ser negativa')
  }

  await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: { quantityReceived: newReceivedQty },
  })

  // Check if all lines are fully received
  const allLines = await prisma.purchaseOrderLine.findMany({
    where: { purchaseOrderId: existing.purchaseOrderId },
  })

  // Refresh the updated line
  const updatedLines = allLines.map((l) =>
    l.id === lineId ? { ...l, quantityReceived: newReceivedQty } : l
  )

  const allFullyReceived = updatedLines.every((l) => {
    const qty = new Decimal(l.quantity.toString())
    const received = new Decimal(l.quantityReceived.toString())
    return received.gte(qty)
  })

  const anyReceived = updatedLines.some((l) => {
    const received = new Decimal(l.quantityReceived.toString())
    return received.gt(0)
  })

  let newStatus = existing.purchaseOrder.status as string
  if (allFullyReceived) {
    newStatus = 'RECEIVED'
  } else if (anyReceived) {
    newStatus = 'PARTIALLY_RECEIVED'
  }

  if (newStatus !== existing.purchaseOrder.status) {
    await prisma.purchaseOrder.update({
      where: { id: existing.purchaseOrderId },
      data: { status: newStatus as any },
    })
  }

  await logAudit({
    userId: session.user.id,
    action: 'RECEIVE_ITEMS',
    entity: 'PurchaseOrderLine',
    entityId: lineId,
    metadata: {
      orderId: existing.purchaseOrderId,
      receivedQty: receivedQty,
    },
  })

  revalidatePath('/compras/ordenes-compra')
  return { success: true }
}
