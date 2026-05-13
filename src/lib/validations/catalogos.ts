import { z } from 'zod'

export const accountCatalogSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'COST']),
  nature: z.enum(['DEBIT', 'CREDIT']),
  parentId: z.string().optional().nullable(),
  level: z.number().int().min(1).default(1),
  acceptsEntries: z.boolean().default(true),
})

export const costCodeSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
})

export const clientSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  rnc: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  creditLimit: z.string().optional().nullable(),
  creditDays: z.number().int().min(0).default(30),
})

export const supplierSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  rnc: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  paymentTermDays: z.number().int().min(0).default(30),
})

export const warehouseSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().optional().nullable(),
})

export const productSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unidad requerida').default('UND'),
  category: z.string().optional().nullable(),
  minStock: z.string().default('0'),
  maxStock: z.string().optional().nullable(),
})

export const projectSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
})
