import { z } from 'zod'

export const journalEntrySchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, 'Cuenta requerida'),
  description: z.string().optional().nullable(),
  debit: z.string().default('0'),
  credit: z.string().default('0'),
})

export const accountingPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
})
