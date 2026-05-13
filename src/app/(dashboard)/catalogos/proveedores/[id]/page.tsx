import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SupplierForm } from '../supplier-form'

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
  if (!supplier) notFound()

  return (
    <div className="space-y-6">
      <SupplierForm
        supplier={{
          ...supplier,
        }}
      />
    </div>
  )
}
