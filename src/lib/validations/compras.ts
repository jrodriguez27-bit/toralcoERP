import { z } from 'zod'

export const requisitionSchema = z.object({
  projectId: z.string().min(1, 'Proyecto requerido'),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const requisitionLineSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  costCodeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.string().min(1, 'Cantidad requerida'),
  estimatedCost: z.string().default('0'),
})

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Proveedor requerido'),
  projectId: z.string().min(1, 'Proyecto requerido'),
  requisitionId: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  paymentTermDays: z.number().int().min(0).default(30),
  notes: z.string().optional().nullable(),
})

export const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  costCodeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitPrice: z.string().min(1, 'Precio unitario requerido'),
  taxRate: z.string().default('0.18'),
})

export const supplierInvoiceSchema = z.object({
  supplierId: z.string().min(1, 'Proveedor requerido'),
  purchaseOrderId: z.string().optional().nullable(),
  supplierInvNumber: z.string().optional().nullable(),
  ncf: z.string().optional().nullable(),
  invoiceDate: z.string().min(1, 'Fecha de factura requerida'),
  dueDate: z.string().min(1, 'Fecha de vencimiento requerida'),
  isrRetention: z.string().default('0'),
  itbisRetention: z.string().default('0'),
  notes: z.string().optional().nullable(),
})

export const supplierInvoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitPrice: z.string().min(1, 'Precio unitario requerido'),
  taxRate: z.string().default('0.18'),
})

export const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Fecha de pago requerida'),
  paymentMethod: z.enum(['CASH', 'CHECK', 'TRANSFER', 'CREDIT_CARD']),
  bankAccount: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
