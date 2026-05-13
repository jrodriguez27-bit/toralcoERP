import { z } from 'zod'

export const stockMovementSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  warehouseId: z.string().min(1, 'Almacén requerido'),
  type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitCost: z.string().default('0'),
  projectId: z.string().optional().nullable(),
  costCodeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const transferSchema = z.object({
  fromWarehouseId: z.string().min(1, 'Almacén origen requerido'),
  toWarehouseId: z.string().min(1, 'Almacén destino requerido'),
  notes: z.string().optional().nullable(),
})

export const transferLineSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  quantity: z.string().min(1, 'Cantidad requerida'),
})
