import { prisma } from '@/lib/prisma'

export async function getNextNcf(type: string): Promise<string> {
  const sequence = await prisma.ncfSequence.findFirst({
    where: { type, isActive: true },
  })

  if (!sequence) {
    throw new Error(`No hay secuencia NCF activa para tipo ${type}`)
  }

  const nextNumber = sequence.currentNumber + 1
  if (nextNumber > sequence.rangeTo) {
    throw new Error(`Secuencia NCF agotada para tipo ${type}`)
  }

  await prisma.ncfSequence.update({
    where: { id: sequence.id },
    data: { currentNumber: nextNumber },
  })

  const paddedNumber = nextNumber.toString().padStart(8, '0')
  return `${sequence.prefix}${paddedNumber}`
}
