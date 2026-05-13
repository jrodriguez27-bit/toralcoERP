'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getReport606(year: number, month: number) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const invoices = await prisma.supplierInvoice.findMany({
    where: {
      invoiceDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      supplier: { select: { rnc: true, name: true } },
    },
    orderBy: { invoiceDate: 'asc' },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    rnc: inv.supplier.rnc || '',
    supplierName: inv.supplier.name,
    ncf: inv.ncf || '',
    invoiceDate: inv.invoiceDate.toISOString(),
    subtotal: inv.subtotal.toString(),
    itbis: inv.taxAmount.toString(),
    isrRetention: inv.isrRetention.toString(),
    itbisRetention: inv.itbisRetention.toString(),
    totalAmount: inv.totalAmount.toString(),
  }))
}

export async function getReport607(year: number, month: number) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const invoices = await prisma.clientInvoice.findMany({
    where: {
      invoiceDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
      ncf: { not: null },
    },
    include: {
      client: { select: { rnc: true, name: true } },
    },
    orderBy: { invoiceDate: 'asc' },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    rnc: inv.client.rnc || '',
    clientName: inv.client.name,
    ncf: inv.ncf || '',
    ncfType: inv.ncfType || '',
    invoiceDate: inv.invoiceDate.toISOString(),
    subtotal: inv.subtotal.toString(),
    itbis: inv.taxAmount.toString(),
    totalAmount: inv.totalAmount.toString(),
  }))
}
