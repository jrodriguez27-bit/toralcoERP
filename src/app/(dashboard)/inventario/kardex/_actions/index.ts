'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getKardexByProduct(productId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  if (!productId) throw new Error('Producto requerido')

  const entries = await prisma.kardexEntry.findMany({
    where: { productId },
    orderBy: { date: 'asc' },
    include: { product: true },
  })

  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString(),
    type: entry.type,
    reference: entry.reference,
    entryQty: entry.entryQty.toString(),
    entryUnitCost: entry.entryUnitCost.toString(),
    entryTotal: entry.entryTotal.toString(),
    exitQty: entry.exitQty.toString(),
    exitUnitCost: entry.exitUnitCost.toString(),
    exitTotal: entry.exitTotal.toString(),
    balanceQty: entry.balanceQty.toString(),
    balanceUnitCost: entry.balanceUnitCost.toString(),
    balanceTotal: entry.balanceTotal.toString(),
  }))
}
