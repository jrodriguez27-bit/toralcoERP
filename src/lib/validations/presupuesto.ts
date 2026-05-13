import { z } from 'zod'

export const budgetSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  projectId: z.string().min(1, 'Proyecto requerido'),
  notes: z.string().optional().nullable(),
})

export const budgetLineSchema = z.object({
  costCodeId: z.string().min(1, 'Código de costo requerido'),
  accountId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitCost: z.string().min(1, 'Costo unitario requerido'),
})
