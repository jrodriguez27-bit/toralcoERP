import { prisma } from '@/lib/prisma'
import { POForm } from '../po-form'

export default async function NuevaOrdenCompraPage() {
  const [suppliers, projects, products, costCodes] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <POForm
        suppliers={supplierOptions}
        projects={projectOptions}
        products={productOptions}
        costCodes={costCodeOptions}
      />
    </div>
  )
}
