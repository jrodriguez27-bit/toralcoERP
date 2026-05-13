import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { WarehouseForm } from '../warehouse-form'

export default async function EditWarehousePage({ params }: { params: { id: string } }) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id: params.id } })
  if (!warehouse) notFound()

  return (
    <div className="space-y-6">
      <WarehouseForm
        warehouse={{
          ...warehouse,
        }}
      />
    </div>
  )
}
