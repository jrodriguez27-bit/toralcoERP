import { prisma } from '@/lib/prisma'
import { ProposalForm } from '../proposal-form'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function NuevaPropuestaPage({ searchParams }: Props) {
  const leads = await prisma.lead.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, company: true },
  })

  const leadOptions = leads.map((l) => ({
    value: l.id,
    label: l.company ? `${l.name} (${l.company})` : l.name,
  }))

  const defaultLeadId = typeof searchParams.leadId === 'string' ? searchParams.leadId : undefined

  return (
    <div className="space-y-6">
      <ProposalForm leads={leadOptions} defaultLeadId={defaultLeadId} />
    </div>
  )
}
