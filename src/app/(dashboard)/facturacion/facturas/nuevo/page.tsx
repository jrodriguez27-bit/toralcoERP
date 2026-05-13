import { prisma } from '@/lib/prisma'
import { InvoiceForm } from '../invoice-form'

export default async function NuevaFacturaPage() {
  const [clients, products] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, description: true },
    }),
  ])

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
  }))

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
    description: p.description || p.name,
  }))

  return (
    <div className="space-y-6">
      <InvoiceForm clients={clientOptions} products={productOptions} />
    </div>
  )
}
