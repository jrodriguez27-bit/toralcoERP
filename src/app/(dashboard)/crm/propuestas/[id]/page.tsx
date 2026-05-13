import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal, formatCurrency, formatDate } from '@/lib/utils'
import { ProposalForm } from '../proposal-form'
import { ProposalActions } from './proposal-actions'

export default async function PropuestaDetailPage({ params }: { params: { id: string } }) {
  const [proposal, leads] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        lead: { select: { id: true, name: true, company: true } },
        lines: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, company: true },
    }),
  ])

  if (!proposal) notFound()

  const leadOptions = leads.map((l) => ({
    value: l.id,
    label: l.company ? `${l.name} (${l.company})` : l.name,
  }))

  const serialized = {
    id: proposal.id,
    number: proposal.number,
    leadId: proposal.leadId,
    title: proposal.title,
    status: proposal.status,
    validUntil: proposal.validUntil ? proposal.validUntil.toISOString().split('T')[0] : null,
    notes: proposal.notes,
    subtotal: serializeDecimal(proposal.subtotal),
    taxAmount: serializeDecimal(proposal.taxAmount),
    totalAmount: serializeDecimal(proposal.totalAmount),
    lines: proposal.lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: serializeDecimal(l.quantity),
      unitPrice: serializeDecimal(l.unitPrice),
      totalAmount: serializeDecimal(l.totalAmount),
    })),
  }

  if (proposal.status === 'DRAFT') {
    return (
      <div className="space-y-6">
        <ProposalForm proposal={serialized} leads={leadOptions} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProposalActions proposal={serialized} leadName={proposal.lead.name} />
    </div>
  )
}
