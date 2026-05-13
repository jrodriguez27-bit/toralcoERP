import { prisma } from '@/lib/prisma'
import { CollectionForm } from '../collection-form'

export default async function NuevoCobroPage() {
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

  const invoiceData = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    clientName: inv.client.name,
    totalAmount: inv.totalAmount.toString(),
    balanceDue: inv.balanceDue.toString(),
  }))

  return (
    <div className="space-y-6">
      <CollectionForm invoices={invoiceData} />
    </div>
  )
}
