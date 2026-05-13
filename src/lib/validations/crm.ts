import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  company: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  estimatedValue: z.string().optional().nullable(),
  probability: z.number().int().min(0).max(100).optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const leadActivitySchema = z.object({
  leadId: z.string().min(1, 'Lead requerido'),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE']),
  description: z.string().min(1, 'Descripción requerida'),
  date: z.string().min(1, 'Fecha requerida'),
})

export const proposalSchema = z.object({
  leadId: z.string().min(1, 'Lead requerido'),
  title: z.string().min(1, 'Título requerido'),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const proposalLineSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.string().min(1, 'Cantidad requerida'),
  unitPrice: z.string().min(1, 'Precio unitario requerido'),
})
