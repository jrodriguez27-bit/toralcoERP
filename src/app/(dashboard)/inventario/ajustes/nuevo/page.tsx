import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AdjustmentForm } from '../adjustment-form'

export default async function NuevoAjustePage() {
  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo Ajuste de Inventario" />
      <AdjustmentForm
        products={products.map((p) => ({
          value: p.id,
          label: `${p.code} - ${p.name}`,
        }))}
        warehouses={warehouses.map((w) => ({
          value: w.id,
          label: `${w.code} - ${w.name}`,
        }))}
      />
    </div>
  )
}
