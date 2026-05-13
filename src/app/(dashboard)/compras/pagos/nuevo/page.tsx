import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/utils'
import { PaymentForm } from '../payment-form'

export default async function NuevoPagoPage() {
  const pendingInvoices = await prisma.supplierInvoice.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const serializedInvoices = pendingInvoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    supplierName: inv.supplier.name,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    totalAmount: serializeDecimal(inv.totalAmount),
    balanceDue: serializeDecimal(inv.balanceDue),
  }))

  return (
    <div className="space-y-6">
      <PaymentForm pendingInvoices={serializedInvoices} />
    </div>
  )
}
