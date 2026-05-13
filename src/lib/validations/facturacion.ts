import { z } from 'zod'

export const ncfSequenceSchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  prefix: z.string().min(1, 'Prefijo requerido'),
  rangeFrom: z.number().int().min(1, 'Rango desde requerido'),
  rangeTo: z.number().int().min(1, 'Rango hasta requerido'),
  expirationDate: z.string().optional().nullable(),
})

export const clientInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  ncfType: z.string().optional().nullable(),
  invoiceDate: z.string().min(1, 'Fecha de factura requerida'),
  dueDate: z.string().min(1, 'Fecha de vencimiento requerida'),
  notes: z.string().optional().nullable(),
})

export const clientInvoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitPrice: z.string().min(1, 'Precio unitario requerido'),
  taxRate: z.string().default('0.18'),
})

export const creditNoteSchema = z.object({
  invoiceId: z.string().min(1, 'Factura requerida'),
  amount: z.string().min(1, 'Monto requerido'),
  reason: z.string().min(1, 'Motivo requerido'),
})

export const collectionSchema = z.object({
  collectionDate: z.string().min(1, 'Fecha de cobro requerida'),
  paymentMethod: z.enum(['CASH', 'CHECK', 'TRANSFER', 'CREDIT_CARD']),
  bankAccount: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
