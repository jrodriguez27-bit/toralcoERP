'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit.service'
import { employeeSchema } from '@/lib/validations/nomina'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEmployee(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const raw = Object.fromEntries(formData.entries())
  const parsed = employeeSchema.parse(raw)

  const employee = await prisma.employee.create({
    data: {
      code: parsed.code,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      cedula: parsed.cedula,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
      hireDate: new Date(parsed.hireDate),
      department: parsed.department || null,
      position: parsed.position,
      projectId: parsed.projectId || null,
      employeeType: parsed.employeeType,
      baseSalary: parsed.baseSalary,
      bankAccount: parsed.bankAccount || null,
      bankName: parsed.bankName || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Employee',
    entityId: employee.id,
    metadata: { code: employee.code, name: `${employee.firstName} ${employee.lastName}` },
  })

  revalidatePath('/nomina/empleados')
  redirect('/nomina/empleados')
}

export async function updateEmployee(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const raw = Object.fromEntries(formData.entries())
  const parsed = employeeSchema.parse(raw)

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      code: parsed.code,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      cedula: parsed.cedula,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
      hireDate: new Date(parsed.hireDate),
      department: parsed.department || null,
      position: parsed.position,
      projectId: parsed.projectId || null,
      employeeType: parsed.employeeType,
      baseSalary: parsed.baseSalary,
      bankAccount: parsed.bankAccount || null,
      bankName: parsed.bankName || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Employee',
    entityId: employee.id,
    metadata: { code: employee.code },
  })

  revalidatePath('/nomina/empleados')
  redirect('/nomina/empleados')
}

export async function deleteEmployee(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const employee = await prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Employee',
    entityId: employee.id,
    metadata: { code: employee.code, softDelete: true },
  })

  revalidatePath('/nomina/empleados')
}

export async function terminateEmployee(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      terminationDate: new Date(),
      isActive: false,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'TERMINATE',
    entity: 'Employee',
    entityId: employee.id,
    metadata: { code: employee.code, terminationDate: new Date().toISOString() },
  })

  revalidatePath('/nomina/empleados')
}
