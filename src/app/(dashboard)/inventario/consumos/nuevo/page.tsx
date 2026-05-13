import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { ConsumptionForm } from '../consumption-form'

export default async function NuevoConsumoPage() {
  const [products, warehouses, projects, costCodes] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.project.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.costCode.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo Consumo Directo" />
      <ConsumptionForm
        products={products.map((p) => ({
          value: p.id,
          label: `${p.code} - ${p.name}`,
        }))}
        warehouses={warehouses.map((w) => ({
          value: w.id,
          label: `${w.code} - ${w.name}`,
        }))}
        projects={projects.map((p) => ({
          value: p.id,
          label: `${p.code} - ${p.name}`,
        }))}
        costCodes={costCodes.map((c) => ({
          value: c.id,
          label: `${c.code} - ${c.name}`,
        }))}
      />
    </div>
  )
}
