import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { KardexView } from './kardex-view'

export default async function KardexPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kardex"
        description="Kardex de inventario por producto"
      />
      <KardexView
        products={products.map((p) => ({
          value: p.id,
          label: `${p.code} - ${p.name}`,
        }))}
      />
    </div>
  )
}
