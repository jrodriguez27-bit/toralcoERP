import { z } from 'zod'

export const employeeSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  cedula: z.string().min(1, 'Cédula requerida'),
  birthDate: z.string().optional().nullable(),
  hireDate: z.string().min(1, 'Fecha de ingreso requerida'),
  department: z.string().optional().nullable(),
  position: z.string().min(1, 'Cargo requerido'),
  projectId: z.string().optional().nullable(),
  employeeType: z.enum(['ADMINISTRATIVE', 'FIELD_WORKER', 'TECHNICIAN', 'MANAGER']).default('ADMINISTRATIVE'),
  baseSalary: z.string().min(1, 'Salario base requerido'),
  bankAccount: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
})

export const payrollRunSchema = z.object({
  periodStart: z.string().min(1, 'Fecha inicio requerida'),
  periodEnd: z.string().min(1, 'Fecha fin requerida'),
  type: z.enum(['MONTHLY', 'BIWEEKLY']).default('MONTHLY'),
  notes: z.string().optional().nullable(),
})
