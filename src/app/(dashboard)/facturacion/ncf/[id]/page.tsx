import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { NcfForm } from '../ncf-form'

export default async function EditNcfPage({ params }: { params: { id: string } }) {
  const sequence = await prisma.ncfSequence.findUnique({
    where: { id: params.id },
  })

  if (!sequence) notFound()

  const serialized = {
    id: sequence.id,
    type: sequence.type,
    prefix: sequence.prefix,
    currentNumber: sequence.currentNumber,
    rangeFrom: sequence.rangeFrom,
    rangeTo: sequence.rangeTo,
    expirationDate: sequence.expirationDate ? sequence.expirationDate.toISOString() : null,
    isActive: sequence.isActive,
  }

  return (
    <div className="space-y-6">
      <NcfForm sequence={serialized} />
    </div>
  )
}
