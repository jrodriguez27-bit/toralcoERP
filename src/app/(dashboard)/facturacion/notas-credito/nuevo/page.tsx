import { prisma } from '@/lib/prisma'
import { CreditNoteForm } from '../credit-note-form'

export default async function NuevaNotaCreditoPage() {
  const invoices = await prisma.clientInvoice.findMany({
    where: {
      status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      balanceDue: { gt: 0 },
    },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const invoiceOptions = invoices.map((inv) => ({
    value: inv.id,
    label: `${inv.number} - ${inv.client.name} (Balance: ${inv.balanceDue.toString()})`,
    balance: inv.balanceDue.toString(),
  }))

  return (
    <div className="space-y-6">
      <CreditNoteForm invoices={invoiceOptions} />
    </div>
  )
}
