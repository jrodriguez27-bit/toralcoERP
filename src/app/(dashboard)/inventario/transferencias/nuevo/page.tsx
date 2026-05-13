import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { TransferForm } from '../transfer-form'

export default async function NuevaTransferenciaPage() {
  const [warehouses, products] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva Transferencia" />
      <TransferForm
        warehouses={warehouses.map((w) => ({
          value: w.id,
          label: `${w.code} - ${w.name}`,
        }))}
        products={products.map((p) => ({
          value: p.id,
          label: `${p.code} - ${p.name}`,
          unit: p.unit,
        }))}
      />
    </div>
  )
}
