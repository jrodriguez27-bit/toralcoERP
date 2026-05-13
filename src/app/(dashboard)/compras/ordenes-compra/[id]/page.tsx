import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { POForm } from '../po-form'

export default async function EditOrdenCompraPage({ params }: { params: { id: string } }) {
  const [order, suppliers, projects, products, costCodes] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        requisition: { select: { id: true, number: true } },
        supplier: { select: { id: true, code: true, name: true } },
        project: { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true } },
            costCode: { select: { id: true, code: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.supplier.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, unit: true },
    }),
    prisma.costCode.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  if (!order) notFound()

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: `${s.code} - ${s.name}`,
  }))

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
    unit: p.unit,
  }))

  const costCodeOptions = costCodes.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
  }))

  const serialized = {
    id: order.id,
    number: order.number,
    supplierId: order.supplierId,
    projectId: order.projectId,
    requisitionId: order.requisitionId,
    requisitionNumber: order.requisition?.number || null,
    status: order.status,
    subtotal: serializeDecimal(order.subtotal),
    taxAmount: serializeDecimal(order.taxAmount),
    totalAmount: serializeDecimal(order.totalAmount),
    deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : null,
    paymentTermDays: order.paymentTermDays,
    notes: order.notes,
    approvedBy: order.approvedBy,
    lines: order.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: `${line.product.code} - ${line.product.name}`,
      productUnit: line.product.unit,
      costCodeId: line.costCodeId,
      costCodeName: line.costCode ? `${line.costCode.code} - ${line.costCode.name}` : null,
      description: line.description,
      quantity: serializeDecimal(line.quantity),
      unitPrice: serializeDecimal(line.unitPrice),
      taxRate: serializeDecimal(line.taxRate),
      totalAmount: serializeDecimal(line.totalAmount),
      quantityReceived: serializeDecimal(line.quantityReceived),
    })),
  }

  return (
    <div className="space-y-6">
      <POForm
        order={serialized}
        suppliers={supplierOptions}
        projects={projectOptions}
        products={productOptions}
        costCodes={costCodeOptions}
      />
    </div>
  )
}
