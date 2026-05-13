'use server'

import { prisma } from '@/lib/prisma'
import { clientInvoiceSchema, clientInvoiceLineSchema } from '@/lib/validations/facturacion'
import { logAudit } from '@/lib/services/audit.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import { getNextNcf } from '@/lib/services/invoicing.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import Decimal from 'decimal.js'

interface InvoiceLineInput {
  productId?: string | null
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

export async function createClientInvoice(data: {
  clientId: string
  ncfType?: string | null
  invoiceDate: string
  dueDate: string
  notes?: string | null
  lines: InvoiceLineInput[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate header
  const header = clientInvoiceSchema.parse({
    clientId: data.clientId,
    ncfType: data.ncfType || null,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    notes: data.notes || null,
  })

  if (!data.lines || data.lines.length === 0) {
    throw new Error('La factura debe tener al menos una linea')
  }

  // Validate and compute lines
  let subtotal = new Decimal(0)
  let taxAmount = new Decimal(0)

  const validatedLines = data.lines.map((line) => {
    const validated = clientInvoiceLineSchema.parse(line)
    const qty = new Decimal(validated.quantity)
    const price = new Decimal(validated.unitPrice)
    const tax = new Decimal(validated.taxRate)

    const lineSubtotal = qty.times(price)
    const lineTax = lineSubtotal.times(tax)
    const lineTotal = lineSubtotal.plus(lineTax)

    subtotal = subtotal.plus(lineSubtotal)
    taxAmount = taxAmount.plus(lineTax)

    return {
      productId: validated.productId || null,
      description: validated.description,
      quantity: qty,
      unitPrice: price,
      taxRate: tax,
      totalAmount: lineTotal,
    }
  })

  const totalAmount = subtotal.plus(taxAmount)

  const number = await generateSequentialNumber(prisma, 'CLIENT_INVOICE', 'FAC')

  const invoice = await prisma.clientInvoice.create({
    data: {
      number,
      clientId: header.clientId,
      ncfType: header.ncfType || null,
      invoiceDate: new Date(header.invoiceDate),
      dueDate: new Date(header.dueDate),
      status: 'DRAFT',
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      balanceDue: totalAmount.toFixed(2),
      notes: header.notes || null,
      lines: {
        create: validatedLines,
      },
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'ClientInvoice',
    entityId: invoice.id,
  })

  revalidatePath('/facturacion/facturas')
  return { success: true, id: invoice.id }
}

export async function issueInvoice(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const invoice = await prisma.clientInvoice.findUnique({
    where: { id },
    include: { lines: true },
  })

  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'DRAFT') {
    throw new Error('Solo se pueden emitir facturas en borrador')
  }

  // Assign NCF if type is set
  let ncf: string | null = null
  if (invoice.ncfType) {
    ncf = await getNextNcf(invoice.ncfType)
  }

  // Find accounting accounts for journal entry
  const arAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '1.1.03' }, acceptsEntries: true, isActive: true },
  })
  const revenueAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '4.1' }, acceptsEntries: true, isActive: true },
  })
  const itbisAccount = await prisma.accountCatalog.findFirst({
    where: { code: { startsWith: '2.1.05' }, acceptsEntries: true, isActive: true },
  })

  let journalEntryId: string | null = null
  if (arAccount && revenueAccount) {
    const lines = [
      {
        accountId: arAccount.id,
        description: `Cuentas por Cobrar - Factura ${invoice.number}`,
        debit: invoice.totalAmount.toString(),
        credit: '0',
      },
      {
        accountId: revenueAccount.id,
        description: `Ingresos - Factura ${invoice.number}`,
        debit: '0',
        credit: invoice.subtotal.toString(),
      },
    ]

    // Add ITBIS line if there's tax
    const taxAmt = new Decimal(invoice.taxAmount.toString())
    if (itbisAccount && taxAmt.gt(0)) {
      lines.push({
        accountId: itbisAccount.id,
        description: `ITBIS por Pagar - Factura ${invoice.number}`,
        debit: '0',
        credit: invoice.taxAmount.toString(),
      })
    } else if (taxAmt.gt(0)) {
      // If no ITBIS account, add to revenue
      lines[1].credit = invoice.totalAmount.toString()
    }

    journalEntryId = await createJournalEntry({
      date: invoice.invoiceDate,
      description: `Factura ${invoice.number}${ncf ? ` - NCF: ${ncf}` : ''}`,
      type: 'AUTOMATIC',
      referenceType: 'ClientInvoice',
      referenceId: invoice.id,
      reference: invoice.number,
      lines,
    })
  }

  await prisma.clientInvoice.update({
    where: { id },
    data: {
      status: 'ISSUED',
      ncf,
      ...(journalEntryId ? { journalEntryId } : {}),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'ISSUE',
    entity: 'ClientInvoice',
    entityId: id,
    metadata: { ncf },
  })

  revalidatePath('/facturacion/facturas')
  return { success: true }
}

export async function cancelInvoice(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const invoice = await prisma.clientInvoice.findUnique({
    where: { id },
    include: {
      collections: true,
    },
  })

  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'DRAFT' && invoice.status !== 'ISSUED') {
    throw new Error('Solo se pueden cancelar facturas en borrador o emitidas')
  }

  if (invoice.collections.length > 0) {
    throw new Error('No se puede cancelar una factura con cobros aplicados')
  }

  await prisma.clientInvoice.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      balanceDue: 0,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CANCEL',
    entity: 'ClientInvoice',
    entityId: id,
  })

  revalidatePath('/facturacion/facturas')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const invoice = await prisma.clientInvoice.findUnique({ where: { id } })
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar facturas en borrador')
  }

  await prisma.clientInvoice.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'ClientInvoice',
    entityId: id,
  })

  revalidatePath('/facturacion/facturas')
  return { success: true }
}
