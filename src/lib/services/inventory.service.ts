import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

export async function createStockMovement(params: {
  productId: string
  warehouseId: string
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  quantity: string | number
  unitCost?: string | number
  reference?: string
  referenceType?: string
  referenceId?: string
  projectId?: string
  costCodeId?: string
  notes?: string
}): Promise<void> {
  const qty = new Decimal(String(params.quantity))
  const cost = new Decimal(String(params.unitCost || '0'))
  const totalCost = qty.mul(cost)

  await prisma.$transaction(async (tx) => {
    // Create movement
    await tx.stockMovement.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        type: params.type,
        quantity: qty.toFixed(2),
        unitCost: cost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        reference: params.reference,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        projectId: params.projectId,
        costCodeId: params.costCodeId,
        notes: params.notes,
      },
    })

    // Update stock
    const isEntry = ['ENTRY', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(params.type)
    const stock = await tx.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: params.productId,
          warehouseId: params.warehouseId,
        },
      },
      create: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantity: isEntry ? qty.toFixed(2) : '0',
        availableQty: isEntry ? qty.toFixed(2) : '0',
      },
      update: {
        quantity: isEntry
          ? { increment: qty.toNumber() }
          : { decrement: qty.toNumber() },
      },
    })

    // Update availableQty
    const currentQty = new Decimal(stock.quantity.toString())
    const reserved = new Decimal(stock.reservedQty.toString())
    await tx.stock.update({
      where: { id: stock.id },
      data: { availableQty: currentQty.minus(reserved).toFixed(2) },
    })

    // Update average cost on entry
    if (isEntry && cost.gt(0)) {
      const product = await tx.product.findUnique({ where: { id: params.productId } })
      if (product) {
        const oldCost = new Decimal(product.averageCost.toString())
        const oldQty = new Decimal(product.lastCost.toString() === '0' ? '0' : '1') // Simplified
        const newAvgCost = oldCost.eq(0) ? cost : oldCost.plus(cost).div(2)
        await tx.product.update({
          where: { id: params.productId },
          data: {
            lastCost: cost.toFixed(2),
            averageCost: newAvgCost.toFixed(2),
          },
        })
      }
    }

    // Create Kardex entry
    const lastKardex = await tx.kardexEntry.findFirst({
      where: { productId: params.productId },
      orderBy: { date: 'desc' },
    })

    const prevBalance = lastKardex
      ? new Decimal(lastKardex.balanceQty.toString())
      : new Decimal(0)
    const prevBalanceTotal = lastKardex
      ? new Decimal(lastKardex.balanceTotal.toString())
      : new Decimal(0)

    const newBalanceQty = isEntry
      ? prevBalance.plus(qty)
      : prevBalance.minus(qty)
    const newBalanceTotal = isEntry
      ? prevBalanceTotal.plus(totalCost)
      : prevBalanceTotal.minus(totalCost)
    const newBalanceUnitCost = newBalanceQty.gt(0)
      ? newBalanceTotal.div(newBalanceQty)
      : new Decimal(0)

    await tx.kardexEntry.create({
      data: {
        productId: params.productId,
        date: new Date(),
        type: params.referenceType || params.type,
        reference: params.reference,
        entryQty: isEntry ? qty.toFixed(2) : '0',
        entryUnitCost: isEntry ? cost.toFixed(2) : '0',
        entryTotal: isEntry ? totalCost.toFixed(2) : '0',
        exitQty: !isEntry ? qty.toFixed(2) : '0',
        exitUnitCost: !isEntry ? cost.toFixed(2) : '0',
        exitTotal: !isEntry ? totalCost.toFixed(2) : '0',
        balanceQty: newBalanceQty.toFixed(2),
        balanceUnitCost: newBalanceUnitCost.toFixed(2),
        balanceTotal: newBalanceTotal.toFixed(2),
      },
    })
  })
}
