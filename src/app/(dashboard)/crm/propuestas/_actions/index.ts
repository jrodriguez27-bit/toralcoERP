'use server'

import { prisma } from '@/lib/prisma'
import { proposalSchema, proposalLineSchema } from '@/lib/validations/crm'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'
import { z } from 'zod'

interface ProposalLineInput {
  description: string
  quantity: string
  unitPrice: string
}

export async function createProposal(data: {
  leadId: string
  title: string
  validUntil?: string | null
  notes?: string | null
  lines: ProposalLineInput[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = proposalSchema.parse(data)
  const validatedLines = data.lines.map((l) => proposalLineSchema.parse(l))

  if (validatedLines.length === 0) {
    throw new Error('La propuesta debe tener al menos una linea')
  }

  const number = await generateSequentialNumber(prisma, 'PROPOSAL', 'PROP')

  let subtotal = new Decimal(0)
  const lineData = validatedLines.map((l) => {
    const qty = new Decimal(l.quantity)
    const price = new Decimal(l.unitPrice)
    const total = qty.times(price)
    subtotal = subtotal.plus(total)
    return {
      description: l.description,
      quantity: qty,
      unitPrice: price,
      totalAmount: total,
    }
  })

  const taxRate = new Decimal('0.18')
  const taxAmount = subtotal.times(taxRate)
  const totalAmount = subtotal.plus(taxAmount)

  const proposal = await prisma.proposal.create({
    data: {
      number,
      leadId: validated.leadId,
      title: validated.title,
      validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
      notes: validated.notes || null,
      subtotal,
      taxAmount,
      totalAmount,
      lines: {
        create: lineData,
      },
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Proposal',
    entityId: proposal.id,
  })

  revalidatePath('/crm/propuestas')
  revalidatePath('/crm/leads')
  return { success: true, id: proposal.id }
}

export async function updateProposal(
  id: string,
  data: {
    leadId: string
    title: string
    validUntil?: string | null
    notes?: string | null
    lines: ProposalLineInput[]
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.proposal.findUnique({ where: { id } })
  if (!existing) throw new Error('Propuesta no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar propuestas en borrador')
  }

  const validated = proposalSchema.parse(data)
  const validatedLines = data.lines.map((l) => proposalLineSchema.parse(l))

  if (validatedLines.length === 0) {
    throw new Error('La propuesta debe tener al menos una linea')
  }

  let subtotal = new Decimal(0)
  const lineData = validatedLines.map((l) => {
    const qty = new Decimal(l.quantity)
    const price = new Decimal(l.unitPrice)
    const total = qty.times(price)
    subtotal = subtotal.plus(total)
    return {
      description: l.description,
      quantity: qty,
      unitPrice: price,
      totalAmount: total,
    }
  })

  const taxRate = new Decimal('0.18')
  const taxAmount = subtotal.times(taxRate)
  const totalAmount = subtotal.plus(taxAmount)

  await prisma.$transaction(async (tx) => {
    await tx.proposalLine.deleteMany({ where: { proposalId: id } })
    await tx.proposal.update({
      where: { id },
      data: {
        leadId: validated.leadId,
        title: validated.title,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        notes: validated.notes || null,
        subtotal,
        taxAmount,
        totalAmount,
        lines: {
          create: lineData,
        },
      },
    })
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Proposal',
    entityId: id,
  })

  revalidatePath('/crm/propuestas')
  revalidatePath('/crm/leads')
  return { success: true }
}

export async function deleteProposal(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.proposal.findUnique({ where: { id } })
  if (!existing) throw new Error('Propuesta no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar propuestas en borrador')
  }

  await prisma.proposal.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Proposal',
    entityId: id,
  })

  revalidatePath('/crm/propuestas')
  revalidatePath('/crm/leads')
  return { success: true }
}

export async function sendProposal(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.proposal.findUnique({
    where: { id },
    include: { lines: true },
  })
  if (!existing) throw new Error('Propuesta no encontrada')
  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden enviar propuestas en borrador')
  }
  if (existing.lines.length === 0) {
    throw new Error('La propuesta debe tener al menos una linea')
  }

  await prisma.proposal.update({
    where: { id },
    data: { status: 'SENT' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'SEND',
    entity: 'Proposal',
    entityId: id,
  })

  revalidatePath('/crm/propuestas')
  return { success: true }
}

export async function acceptProposal(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.proposal.findUnique({ where: { id } })
  if (!existing) throw new Error('Propuesta no encontrada')
  if (existing.status !== 'SENT') {
    throw new Error('Solo se pueden aceptar propuestas enviadas')
  }

  await prisma.proposal.update({
    where: { id },
    data: { status: 'ACCEPTED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'ACCEPT',
    entity: 'Proposal',
    entityId: id,
  })

  revalidatePath('/crm/propuestas')
  return { success: true }
}

export async function rejectProposal(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.proposal.findUnique({ where: { id } })
  if (!existing) throw new Error('Propuesta no encontrada')
  if (existing.status !== 'SENT') {
    throw new Error('Solo se pueden rechazar propuestas enviadas')
  }

  await prisma.proposal.update({
    where: { id },
    data: { status: 'REJECTED' },
  })

  await logAudit({
    userId: session.user.id,
    action: 'REJECT',
    entity: 'Proposal',
    entityId: id,
  })

  revalidatePath('/crm/propuestas')
  return { success: true }
}
