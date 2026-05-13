import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ClientForm } from '../client-form'

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) notFound()

  return (
    <div className="space-y-6">
      <ClientForm
        client={{
          ...client,
          creditLimit: client.creditLimit?.toString() || null,
        }}
      />
    </div>
  )
}
