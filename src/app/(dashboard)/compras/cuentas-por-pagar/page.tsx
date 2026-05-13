import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { APDashboard } from './ap-dashboard'
import Decimal from 'decimal.js'

export default async function CuentasPorPagarPage() {
  const invoices = await prisma.supplierInvoice.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Compute aging for each invoice
  const invoicesWithAging = invoices.map((inv) => {
    const dueDate = new Date(inv.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const diffMs = today.getTime() - dueDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    // If diffDays < 0, invoice is not yet due (current)
    // If diffDays >= 0, invoice is overdue by that many days

    let bucket: string
    if (diffDays < 0) {
      bucket = 'current'
    } else if (diffDays <= 30) {
      bucket = '1-30'
    } else if (diffDays <= 60) {
      bucket = '31-60'
    } else if (diffDays <= 90) {
      bucket = '61-90'
    } else {
      bucket = '90+'
    }

    return {
      id: inv.id,
      number: inv.number,
      supplierName: inv.supplier.name,
      invoiceDate: inv.invoiceDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      totalAmount: serializeDecimal(inv.totalAmount),
      balanceDue: serializeDecimal(inv.balanceDue),
      status: inv.status,
      agingDays: diffDays,
      bucket,
    }
  })

  // Compute bucket totals
  const buckets = {
    current: new Decimal(0),
    '1-30': new Decimal(0),
    '31-60': new Decimal(0),
    '61-90': new Decimal(0),
    '90+': new Decimal(0),
  }

  for (const inv of invoicesWithAging) {
    const balance = new Decimal(inv.balanceDue)
    buckets[inv.bucket as keyof typeof buckets] = buckets[inv.bucket as keyof typeof buckets].plus(balance)
  }

  const grandTotal = Object.values(buckets).reduce(
    (sum, val) => sum.plus(val),
    new Decimal(0)
  )

  const serializedBuckets = {
    current: buckets.current.toFixed(2),
    '1-30': buckets['1-30'].toFixed(2),
    '31-60': buckets['31-60'].toFixed(2),
    '61-90': buckets['61-90'].toFixed(2),
    '90+': buckets['90+'].toFixed(2),
    total: grandTotal.toFixed(2),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por Pagar"
        description="Resumen de cuentas por pagar y antigüedad de saldos"
      />
      <APDashboard
        invoices={invoicesWithAging}
        buckets={serializedBuckets}
      />
    </div>
  )
}
