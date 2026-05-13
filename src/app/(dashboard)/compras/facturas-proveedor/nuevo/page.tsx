import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/utils'
import { InvoiceForm } from '../invoice-form'

export default async function NuevaFacturaProveedorPage() {
  const [suppliers, products, purchaseOrders] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, code: true, name: true } },
          },
        },
      },
    }),
  ])

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }))

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
  }))

  const serializedPOs = purchaseOrders.map((po) => ({
    value: po.id,
    label: `${po.number} - ${po.supplier.name}`,
    supplierId: po.supplier.id,
    lines: po.lines.map((line) => ({
      productId: line.productId,
      productLabel: line.product
        ? `${line.product.code} - ${line.product.name}`
        : '',
      description: line.description || line.product?.name || '',
      quantity: serializeDecimal(line.quantity),
      unitPrice: serializeDecimal(line.unitPrice),
      taxRate: serializeDecimal(line.taxRate),
    })),
  }))

  return (
    <div className="space-y-6">
      <InvoiceForm
        suppliers={supplierOptions}
        products={productOptions}
        purchaseOrders={serializedPOs}
      />
    </div>
  )
}
