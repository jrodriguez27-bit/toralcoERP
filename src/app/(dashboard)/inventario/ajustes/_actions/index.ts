'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStockMovement } from '@/lib/services/inventory.service'
import { logAudit } from '@/lib/services/audit.service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  warehouseId: z.string().min(1, 'Almacen requerido'),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitCost: z.string().optional().default('0'),
  notes: z.string().optional().nullable(),
})

export async function createAdjustment(data: {
  productId: string
  warehouseId: string
  type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'
  quantity: string
  unitCost?: string
  notes?: string | null
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = adjustmentSchema.parse(data)

  // For exits, check stock availability
  if (validated.type === 'ADJUSTMENT_OUT') {
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: validated.productId,
          warehouseId: validated.warehouseId,
        },
      },
    })

    const availableQty = stock ? Number(stock.availableQty.toString()) : 0
    const requestedQty = Number(validated.quantity)

    if (requestedQty > availableQty) {
      throw new Error(
        `Stock insuficiente. Disponible: ${availableQty.toFixed(2)}, Solicitado: ${requestedQty.toFixed(2)}`
      )
    }
  }

  // For adjustment out, use average cost if no cost provided
  let unitCost = validated.unitCost || '0'
  if (validated.type === 'ADJUSTMENT_OUT' && unitCost === '0') {
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    })
    if (product) {
      unitCost = product.averageCost.toString()
    }
  }

  await createStockMovement({
    productId: validated.productId,
    warehouseId: validated.warehouseId,
    type: validated.type,
    quantity: validated.quantity,
    unitCost,
    referenceType: 'ADJUSTMENT',
    notes: validated.notes || undefined,
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Adjustment',
    entityId: validated.productId,
    metadata: {
      type: validated.type,
      productId: validated.productId,
      warehouseId: validated.warehouseId,
      quantity: validated.quantity,
    },
  })

  revalidatePath('/inventario/ajustes')
  revalidatePath('/inventario/stock')
  revalidatePath('/inventario/movimientos')
  return { success: true }
}
