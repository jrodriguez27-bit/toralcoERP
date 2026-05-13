import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProductForm } from '../product-form'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) notFound()

  return (
    <div className="space-y-6">
      <ProductForm
        product={{
          ...product,
          minStock: product.minStock.toString(),
          maxStock: product.maxStock?.toString() || null,
        }}
      />
    </div>
  )
}
