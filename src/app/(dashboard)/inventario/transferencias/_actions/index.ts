'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStockMovement } from '@/lib/services/inventory.service'
import { logAudit } from '@/lib/services/audit.service'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import { transferSchema, transferLineSchema } from '@/lib/validations/inventario'
import { z } from 'zod'

export async function createTransfer(data: {
  fromWarehouseId: string
  toWarehouseId: string
  notes?: string | null
  lines: { productId: string; quantity: string }[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate header
  const header = transferSchema.parse({
    fromWarehouseId: data.fromWarehouseId,
    toWarehouseId: data.toWarehouseId,
    notes: data.notes,
  })

  if (header.fromWarehouseId === header.toWarehouseId) {
    throw new Error('El almacen origen y destino no pueden ser iguales')
  }

  // Validate lines
  if (!data.lines || data.lines.length === 0) {
    throw new Error('Debe agregar al menos una linea')
  }

  const validatedLines = data.lines.map((line) => transferLineSchema.parse(line))

  const number = await generateSequentialNumber(prisma, 'TRANSFER', 'TRF')

  const transfer = await prisma.transfer.create({
    data: {
      number,
      fromWarehouseId: header.fromWarehouseId,
      toWarehouseId: header.toWarehouseId,
      status: 'REQUESTED',
      requestedBy: session.user.id,
      notes: header.notes || null,
      lines: {
        create: validatedLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      },
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Transfer',
    entityId: transfer.id,
    metadata: { number, linesCount: validatedLines.length },
  })

  revalidatePath('/inventario/transferencias')
  return { success: true, id: transfer.id }
}

export async function approveTransfer(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const transfer = await prisma.transfer.findUnique({ where: { id } })
  if (!transfer) throw new Error('Transferencia no encontrada')
  if (transfer.status !== 'REQUESTED') {
    throw new Error('Solo se pueden aprobar transferencias en estado Solicitado')
  }

  await prisma.transfer.update({
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
    entity: 'Transfer',
    entityId: id,
  })

  revalidatePath('/inventario/transferencias')
  revalidatePath(`/inventario/transferencias/${id}`)
  return { success: true }
}

export async function dispatchTransfer(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!transfer) throw new Error('Transferencia no encontrada')
  if (transfer.status !== 'APPROVED') {
    throw new Error('Solo se pueden despachar transferencias aprobadas')
  }

  // Verify stock availability for all lines
  for (const line of transfer.lines) {
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: line.productId,
          warehouseId: transfer.fromWarehouseId,
        },
      },
    })

    const availableQty = stock ? Number(stock.availableQty.toString()) : 0
    const requestedQty = Number(line.quantity.toString())

    if (requestedQty > availableQty) {
      const product = await prisma.product.findUnique({ where: { id: line.productId } })
      throw new Error(
        `Stock insuficiente para ${product?.name || line.productId}. Disponible: ${availableQty.toFixed(2)}, Solicitado: ${requestedQty.toFixed(2)}`
      )
    }
  }

  // Create TRANSFER_OUT movements for each line
  for (const line of transfer.lines) {
    const product = await prisma.product.findUnique({ where: { id: line.productId } })
    await createStockMovement({
      productId: line.productId,
      warehouseId: transfer.fromWarehouseId,
      type: 'TRANSFER_OUT',
      quantity: line.quantity.toString(),
      unitCost: product?.averageCost.toString() || '0',
      reference: transfer.number,
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
    })
  }

  await prisma.transfer.update({
    where: { id },
    data: {
      status: 'DISPATCHED',
      dispatchedAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DISPATCH',
    entity: 'Transfer',
    entityId: id,
  })

  revalidatePath('/inventario/transferencias')
  revalidatePath(`/inventario/transferencias/${id}`)
  revalidatePath('/inventario/stock')
  revalidatePath('/inventario/movimientos')
  return { success: true }
}

export async function receiveTransfer(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!transfer) throw new Error('Transferencia no encontrada')
  if (transfer.status !== 'DISPATCHED') {
    throw new Error('Solo se pueden recibir transferencias despachadas')
  }

  // Create TRANSFER_IN movements for each line
  for (const line of transfer.lines) {
    const product = await prisma.product.findUnique({ where: { id: line.productId } })
    await createStockMovement({
      productId: line.productId,
      warehouseId: transfer.toWarehouseId,
      type: 'TRANSFER_IN',
      quantity: line.quantity.toString(),
      unitCost: product?.averageCost.toString() || '0',
      reference: transfer.number,
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
    })
  }

  await prisma.transfer.update({
    where: { id },
    data: {
      status: 'RECEIVED',
      receivedAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'RECEIVE',
    entity: 'Transfer',
    entityId: id,
  })

  revalidatePath('/inventario/transferencias')
  revalidatePath(`/inventario/transferencias/${id}`)
  revalidatePath('/inventario/stock')
  revalidatePath('/inventario/movimientos')
  return { success: true }
}

export async function cancelTransfer(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const transfer = await prisma.transfer.findUnique({ where: { id } })
  if (!transfer) throw new Error('Transferencia no encontrada')
  if (!['REQUESTED', 'APPROVED'].includes(transfer.status)) {
    throw new Error('Solo se pueden cancelar transferencias en estado Solicitado o Aprobado')
  }

  await prisma.transfer.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CANCEL',
    entity: 'Transfer',
    entityId: id,
  })

  revalidatePath('/inventario/transferencias')
  revalidatePath(`/inventario/transferencias/${id}`)
  return { success: true }
}

export async function deleteTransfer(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const transfer = await prisma.transfer.findUnique({ where: { id } })
  if (!transfer) throw new Error('Transferencia no encontrada')
  if (transfer.status !== 'REQUESTED') {
    throw new Error('Solo se pueden eliminar transferencias en estado Solicitado')
  }

  await prisma.transfer.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Transfer',
    entityId: id,
  })

  revalidatePath('/inventario/transferencias')
  return { success: true }
}
