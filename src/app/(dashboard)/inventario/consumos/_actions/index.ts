'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStockMovement } from '@/lib/services/inventory.service'
import { logAudit } from '@/lib/services/audit.service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const consumptionSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  warehouseId: z.string().min(1, 'Almacen requerido'),
  quantity: z.string().min(1, 'Cantidad requerida'),
  projectId: z.string().min(1, 'Proyecto requerido'),
  costCodeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function createConsumption(data: {
  productId: string
  warehouseId: string
  quantity: string
  projectId: string
  costCodeId?: string | null
  notes?: string | null
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = consumptionSchema.parse(data)

  // Get the product's average cost for the unit cost
  const product = await prisma.product.findUnique({
    where: { id: validated.productId },
  })
  if (!product) throw new Error('Producto no encontrado')

  // Check stock availability
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

  await createStockMovement({
    productId: validated.productId,
    warehouseId: validated.warehouseId,
    type: 'EXIT',
    quantity: validated.quantity,
    unitCost: product.averageCost.toString(),
    referenceType: 'CONSUMPTION',
    projectId: validated.projectId,
    costCodeId: validated.costCodeId || undefined,
    notes: validated.notes || undefined,
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Consumption',
    entityId: validated.productId,
    metadata: {
      productId: validated.productId,
      warehouseId: validated.warehouseId,
      quantity: validated.quantity,
      projectId: validated.projectId,
    },
  })

  revalidatePath('/inventario/consumos')
  revalidatePath('/inventario/stock')
  revalidatePath('/inventario/movimientos')
  return { success: true }
}
