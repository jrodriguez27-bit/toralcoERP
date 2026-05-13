import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Total Ingresos: sum of ISSUED/PAID client invoices
  const ingresosResult = await prisma.clientInvoice.aggregate({
    where: { status: { in: ['ISSUED', 'PAID'] } },
    _sum: { totalAmount: true },
  })
  const totalIngresos = ingresosResult._sum.totalAmount?.toString() ?? '0'

  // Total Gastos: sum of all supplier invoices
  const gastosResult = await prisma.supplierInvoice.aggregate({
    _sum: { totalAmount: true },
  })
  const totalGastos = gastosResult._sum.totalAmount?.toString() ?? '0'

  // CxC: balanceDue of client invoices ISSUED/PARTIALLY_PAID
  const cxcResult = await prisma.clientInvoice.aggregate({
    where: { status: { in: ['ISSUED', 'PARTIALLY_PAID'] } },
    _sum: { balanceDue: true },
  })
  const totalCxC = cxcResult._sum.balanceDue?.toString() ?? '0'

  // CxP: balanceDue of supplier invoices PENDING/PARTIALLY_PAID
  const cxpResult = await prisma.supplierInvoice.aggregate({
    where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
    _sum: { balanceDue: true },
  })
  const totalCxP = cxpResult._sum.balanceDue?.toString() ?? '0'

  // Pipeline value: leads not WON/LOST
  const pipelineResult = await prisma.lead.aggregate({
    where: { stage: { notIn: ['WON', 'LOST'] } },
    _sum: { estimatedValue: true },
  })
  const pipelineValue = pipelineResult._sum.estimatedValue?.toString() ?? '0'

  // Pending requisitions
  const pendingRequisitions = await prisma.requisition.count({
    where: { status: 'PENDING_APPROVAL' },
  })

  // Unsigned OCs (PENDING_APPROVAL)
  const unsignedOCs = await prisma.purchaseOrder.count({
    where: { status: 'PENDING_APPROVAL' },
  })

  // Overdue invoices (client invoices past due with balance)
  const now = new Date()
  const overdueInvoices = await prisma.clientInvoice.count({
    where: {
      status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
  })

  return (
    <DashboardView
      totalIngresos={totalIngresos}
      totalGastos={totalGastos}
      totalCxC={totalCxC}
      totalCxP={totalCxP}
      pipelineValue={pipelineValue}
      pendingRequisitions={pendingRequisitions}
      unsignedOCs={unsignedOCs}
      overdueInvoices={overdueInvoices}
    />
  )
}
