'use server'

import { prisma } from '@/lib/prisma'
import { leadSchema, leadActivitySchema } from '@/lib/validations/crm'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

export async function createLead(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = leadSchema.parse({
    ...raw,
    probability: raw.probability ? Number(raw.probability) : null,
  })

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      company: data.company || null,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || null,
      estimatedValue: data.estimatedValue ? new Decimal(data.estimatedValue) : null,
      probability: data.probability ?? null,
      assignedTo: data.assignedTo || null,
      nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'Lead',
    entityId: lead.id,
  })

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
  return { success: true, id: lead.id }
}

export async function updateLead(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = leadSchema.parse({
    ...raw,
    probability: raw.probability ? Number(raw.probability) : null,
  })

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) throw new Error('Lead no encontrado')

  await prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      company: data.company || null,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || null,
      estimatedValue: data.estimatedValue ? new Decimal(data.estimatedValue) : null,
      probability: data.probability ?? null,
      assignedTo: data.assignedTo || null,
      nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
      notes: data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Lead',
    entityId: id,
  })

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
  return { success: true }
}

export async function deleteLead(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) throw new Error('Lead no encontrado')

  await prisma.lead.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Lead',
    entityId: id,
  })

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
  return { success: true }
}

export async function changeStage(id: string, stage: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) throw new Error('Lead no encontrado')

  const updateData: Record<string, unknown> = { stage }

  if (stage === 'WON') {
    updateData.wonDate = new Date()
    updateData.lostDate = null
    updateData.lostReason = null
  } else if (stage === 'LOST') {
    updateData.lostDate = new Date()
    updateData.wonDate = null
  } else {
    updateData.wonDate = null
    updateData.lostDate = null
    updateData.lostReason = null
  }

  await prisma.lead.update({
    where: { id },
    data: updateData,
  })

  await logAudit({
    userId: session.user.id,
    action: 'CHANGE_STAGE',
    entity: 'Lead',
    entityId: id,
    metadata: { stage },
  })

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
  return { success: true }
}

export async function addActivity(data: {
  leadId: string
  type: string
  description: string
  date: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const validated = leadActivitySchema.parse(data)

  const lead = await prisma.lead.findUnique({ where: { id: validated.leadId } })
  if (!lead) throw new Error('Lead no encontrado')

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: validated.leadId,
      type: validated.type,
      description: validated.description,
      date: new Date(validated.date),
      createdBy: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'ADD_ACTIVITY',
    entity: 'LeadActivity',
    entityId: activity.id,
    metadata: { leadId: validated.leadId },
  })

  revalidatePath('/crm/leads')
  return { success: true, id: activity.id }
}

export async function convertLead(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) throw new Error('Lead no encontrado')
  if (lead.stage !== 'WON') throw new Error('Solo se pueden convertir leads ganados')
  if (lead.clientId) throw new Error('Este lead ya fue convertido')

  const clientCode = await generateSequentialNumber(prisma, 'CLIENT', 'CLI')
  const projectCode = await generateSequentialNumber(prisma, 'PROJECT', 'PRY')

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        code: clientCode,
        name: lead.company || lead.name,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
      },
    })

    const project = await tx.project.create({
      data: {
        code: projectCode,
        name: lead.name,
        clientId: client.id,
        status: 'PLANNING',
      },
    })

    await tx.lead.update({
      where: { id },
      data: { clientId: client.id },
    })

    return { clientId: client.id, projectId: project.id }
  })

  await logAudit({
    userId: session.user.id,
    action: 'CONVERT',
    entity: 'Lead',
    entityId: id,
    metadata: { clientId: result.clientId, projectId: result.projectId },
  })

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
  return { success: true, ...result }
}
