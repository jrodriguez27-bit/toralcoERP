import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { RequisitionForm } from '../requisition-form'

export default async function EditRequisicionPage({ params }: { params: { id: string } }) {
  const [requisition, projects, products, costCodes, suppliers] = await Promise.all([
    prisma.requisition.findUnique({
      where: { id: params.id },
      include: {
        lines: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true } },
            costCode: { select: { id: true, code: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
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
    prisma.supplier.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  if (!requisition) notFound()

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

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: `${s.code} - ${s.name}`,
  }))

  const serialized = {
    id: requisition.id,
    number: requisition.number,
    projectId: requisition.projectId,
    description: requisition.description,
    status: requisition.status,
    notes: requisition.notes,
    requestedBy: requisition.requestedBy,
    approvedBy: requisition.approvedBy,
    lines: requisition.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productName: `${line.product.code} - ${line.product.name}`,
      productUnit: line.product.unit,
      costCodeId: line.costCodeId,
      costCodeName: line.costCode ? `${line.costCode.code} - ${line.costCode.name}` : null,
      description: line.description,
      quantity: serializeDecimal(line.quantity),
      estimatedCost: serializeDecimal(line.estimatedCost),
      convertedQty: serializeDecimal(line.convertedQty),
    })),
  }

  return (
    <div className="space-y-6">
      <RequisitionForm
        requisition={serialized}
        projects={projectOptions}
        products={productOptions}
        costCodes={costCodeOptions}
        suppliers={supplierOptions}
      />
    </div>
  )
}
