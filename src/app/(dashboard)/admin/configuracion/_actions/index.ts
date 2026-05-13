'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit.service'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

// ===== Company =====

export async function getCompany() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const company = await prisma.company.findFirst()
  return company
    ? {
        id: company.id,
        name: company.name,
        rnc: company.rnc,
        address: company.address ?? '',
        phone: company.phone ?? '',
        email: company.email ?? '',
        website: company.website ?? '',
      }
    : null
}

export async function updateCompany(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const name = formData.get('name') as string
  const rnc = formData.get('rnc') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string

  if (!name || !rnc) throw new Error('Nombre y RNC son requeridos')

  const existing = await prisma.company.findFirst()

  let company
  if (existing) {
    company = await prisma.company.update({
      where: { id: existing.id },
      data: { name, rnc, address, phone, email },
    })
  } else {
    company = await prisma.company.create({
      data: { name, rnc, address, phone, email },
    })
  }

  await logAudit({
    userId: session.user.id!,
    action: existing ? 'UPDATE' : 'CREATE',
    entity: 'Company',
    entityId: company.id,
  })

  revalidatePath('/admin/configuracion')
  return { success: true }
}

// ===== Users =====

export async function getUsers() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  })

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!name || !email || !password || !role) {
    throw new Error('Todos los campos son requeridos')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Ya existe un usuario con ese email')

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role as any,
    },
  })

  await logAudit({
    userId: session.user.id!,
    action: 'CREATE',
    entity: 'User',
    entityId: user.id,
  })

  revalidatePath('/admin/configuracion')
  return { success: true }
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!name || !email || !role) {
    throw new Error('Nombre, email y rol son requeridos')
  }

  const data: Record<string, unknown> = { name, email, role }
  if (password) {
    data.password = await bcrypt.hash(password, 12)
  }

  await prisma.user.update({
    where: { id },
    data: data as any,
  })

  await logAudit({
    userId: session.user.id!,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
  })

  revalidatePath('/admin/configuracion')
  return { success: true }
}

export async function toggleUserActive(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error('Usuario no encontrado')

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  })

  await logAudit({
    userId: session.user.id!,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    changes: { isActive: { old: user.isActive, new: !user.isActive } },
  })

  revalidatePath('/admin/configuracion')
  return { success: true }
}

// ===== Fiscal Config =====

export async function getFiscalConfigs() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const configs = await prisma.fiscalConfig.findMany({
    orderBy: { key: 'asc' },
  })

  return configs.map((c) => ({
    id: c.id,
    key: c.key,
    value: c.value,
    description: c.description ?? '',
  }))
}

export async function updateFiscalConfig(id: string, value: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  await prisma.fiscalConfig.update({
    where: { id },
    data: { value },
  })

  await logAudit({
    userId: session.user.id!,
    action: 'UPDATE',
    entity: 'FiscalConfig',
    entityId: id,
  })

  revalidatePath('/admin/configuracion')
  return { success: true }
}
