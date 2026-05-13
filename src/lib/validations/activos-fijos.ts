import { z } from 'zod'

export const assetCategorySchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  usefulLifeMonths: z.number().int().min(1, 'Vida útil requerida'),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).default('STRAIGHT_LINE'),
  depreciationAccountId: z.string().optional().nullable(),
  expenseAccountId: z.string().optional().nullable(),
})

export const fixedAssetSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Categoría requerida'),
  projectId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  acquisitionDate: z.string().min(1, 'Fecha de adquisición requerida'),
  acquisitionCost: z.string().min(1, 'Costo de adquisición requerido'),
  residualValue: z.string().default('0'),
  usefulLifeMonths: z.number().int().min(1, 'Vida útil requerida'),
  location: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
})

export const maintenanceSchema = z.object({
  assetId: z.string().min(1, 'Activo requerido'),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE']),
  description: z.string().min(1, 'Descripción requerida'),
  scheduledDate: z.string().optional().nullable(),
  cost: z.string().default('0'),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
