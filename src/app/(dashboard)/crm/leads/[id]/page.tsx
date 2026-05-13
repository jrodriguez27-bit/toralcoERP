import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { LeadDetail } from './lead-detail'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true, code: true } },
      activities: {
        orderBy: { date: 'desc' },
      },
      proposals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  })

  if (!lead) notFound()

  const serialized = {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    stage: lead.stage,
    estimatedValue: lead.estimatedValue ? serializeDecimal(lead.estimatedValue) : null,
    probability: lead.probability,
    assignedTo: lead.assignedTo,
    nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.toISOString().split('T')[0] : null,
    notes: lead.notes,
    clientId: lead.clientId,
    wonDate: lead.wonDate ? lead.wonDate.toISOString() : null,
    lostDate: lead.lostDate ? lead.lostDate.toISOString() : null,
    lostReason: lead.lostReason,
    createdAt: lead.createdAt.toISOString(),
    client: lead.client ? { id: lead.client.id, name: lead.client.name, code: lead.client.code } : null,
    activities: lead.activities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      date: a.date.toISOString(),
      createdBy: a.createdBy,
    })),
    proposals: lead.proposals.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      status: p.status,
      totalAmount: serializeDecimal(p.totalAmount),
      createdAt: p.createdAt.toISOString(),
    })),
  }

  return (
    <div className="space-y-6">
      <LeadDetail lead={serialized} />
    </div>
  )
}
