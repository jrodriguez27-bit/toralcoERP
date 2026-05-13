'use server'

import { prisma } from '@/lib/prisma'
import { supplierInvoiceSchema, supplierInvoiceLineSchema } from '@/lib/validations/compras'
import { logAudit } from '@/lib/services/audit.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import { executeCommittedAmount } from '@/lib/services/budget.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSequentialNumber } from '@/lib/utils'
import Decimal from 'decimal.js'

interface InvoiceLineInput {
  productId?: string | null
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

export async function createSupplierInvoice(data: {
  supplierId: string
  purchaseOrderId?: string | null
  supplierInvNumber?: string | null
  ncf?: string | null
  invoiceDate: string
  dueDate: string
  isrRetention?: string
  itbisRetention?: string
  notes?: string | null
  lines: InvoiceLineInput[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate header
  const headerData = supplierInvoiceSchema.parse({
    supplierId: data.supplierId,
    purchaseOrderId: data.purchaseOrderId || null,
    supplierInvNumber: data.supplierInvNumber || null,
    ncf: data.ncf || null,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    isrRetention: data.isrRetention || '0',
    itbisRetention: data.itbisRetention || '0',
    notes: data.notes || null,
  })

  if (!data.lines || data.lines.length === 0) {
    throw new Error('La factura debe tener al menos una linea')
  }

  // Validate each line
  const validatedLines = data.lines.map((line) => supplierInvoiceLineSchema.parse(line))

  // Compute line totals
  let subtotal = new Decimal(0)
  let taxAmount = new Decimal(0)

  const computedLines = validatedLines.map((line) => {
    const qty = new Decimal(line.quantity)
    const price = new Decimal(line.unitPrice)
    const rate = new Decimal(line.taxRate)
    const lineSubtotal = qty.times(price)
    const lineTax = lineSubtotal.times(rate)
    const lineTotalAmount = lineSubtotal.plus(lineTax)

    subtotal = subtotal.plus(lineSubtotal)
    taxAmount = taxAmount.plus(lineTax)

    return {
      productId: line.productId || null,
      description: line.description,
      quantity: qty,
      unitPrice: price,
      taxRate: rate,
      totalAmount: lineTotalAmount,
    }
  })

  const isrRetention = new Decimal(headerData.isrRetention)
  const itbisRetention = new Decimal(headerData.itbisRetention)
  const totalAmount = subtotal.plus(taxAmount).minus(isrRetention).minus(itbisRetention)
  const balanceDue = totalAmount

  const number = await generateSequentialNumber(prisma, 'SUPPLIER_INVOICE', 'FP')

  // Find accounts for journal entry
  const expenseAccount = await prisma.accountCatalog.findFirst({
    where: { type: 'EXPENSE', acceptsEntries: true, isActive: true, deletedAt: null },
    orderBy: { code: 'asc' },
  })

  const apAccount = await prisma.accountCatalog.findFirst({
    where: {
      type: 'LIABILITY',
      code: { startsWith: '2.1' },
      acceptsEntries: true,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { code: 'asc' },
  })

  if (!expenseAccount) throw new Error('No se encontro una cuenta de gastos configurada')
  if (!apAccount) throw new Error('No se encontro una cuenta de cuentas por pagar configurada')

  // Create journal entry
  const journalEntryId = await createJournalEntry({
    date: new Date(headerData.invoiceDate),
    description: `Factura proveedor ${number}`,
    type: 'AUTOMATIC',
    referenceType: 'SUPPLIER_INVOICE',
    lines: [
      {
        accountId: expenseAccount.id,
        description: `Gasto factura ${number}`,
        debit: totalAmount.toFixed(2),
        credit: '0',
      },
      {
        accountId: apAccount.id,
        description: `CxP factura ${number}`,
        debit: '0',
        credit: totalAmount.toFixed(2),
      },
    ],
  })

  // Create invoice with lines
  const invoice = await prisma.supplierInvoice.create({
    data: {
      number,
      supplierInvNumber: headerData.supplierInvNumber || null,
      ncf: headerData.ncf || null,
      purchaseOrderId: headerData.purchaseOrderId || null,
      supplierId: headerData.supplierId,
      invoiceDate: new Date(headerData.invoiceDate),
      dueDate: new Date(headerData.dueDate),
      status: 'PENDING',
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      isrRetention: isrRetention.toFixed(2),
      itbisRetention: itbisRetention.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
      notes: headerData.notes || null,
      journalEntryId,
      lines: {
        create: computedLines.map((line) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity.toFixed(2),
          unitPrice: line.unitPrice.toFixed(2),
          taxRate: line.taxRate.toFixed(4),
          totalAmount: line.totalAmount.toFixed(2),
        })),
      },
    },
  })

  // Update journal entry with referenceId
  await prisma.journalEntry.update({
    where: { id: journalEntryId },
    data: { referenceId: invoice.id },
  })

  // If linked to PO, execute committed budget amount
  if (headerData.purchaseOrderId) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: headerData.purchaseOrderId },
      include: { lines: { include: { costCode: true } }, project: true },
    })

    if (po && po.lines.length > 0) {
      for (const poLine of po.lines) {
        if (poLine.costCodeId) {
          try {
            await executeCommittedAmount(
              po.projectId,
              poLine.costCodeId,
              poLine.totalAmount.toString()
            )
          } catch {
            // Budget execution is best-effort; don't block invoice creation
          }
        }
      }
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'SupplierInvoice',
    entityId: invoice.id,
    metadata: { number, totalAmount: totalAmount.toFixed(2) },
  })

  revalidatePath('/compras/facturas-proveedor')
  return { success: true, id: invoice.id }
}

export async function cancelSupplierInvoice(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const invoice = await prisma.supplierInvoice.findUnique({
    where: { id },
    include: { payments: true },
  })

  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'PENDING') {
    throw new Error('Solo se pueden cancelar facturas pendientes')
  }
  if (invoice.payments.length > 0) {
    throw new Error('No se puede cancelar una factura con pagos aplicados')
  }

  await prisma.supplierInvoice.update({
    where: { id },
    data: { status: 'CANCELLED', balanceDue: 0 },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CANCEL',
    entity: 'SupplierInvoice',
    entityId: id,
  })

  revalidatePath('/compras/facturas-proveedor')
  return { success: true }
}

export async function deleteSupplierInvoice(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const invoice = await prisma.supplierInvoice.findUnique({
    where: { id },
    include: { payments: true },
  })

  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'PENDING') {
    throw new Error('Solo se pueden eliminar facturas pendientes')
  }
  if (invoice.payments.length > 0) {
    throw new Error('No se puede eliminar una factura con pagos aplicados')
  }

  await prisma.supplierInvoice.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'SupplierInvoice',
    entityId: id,
  })

  revalidatePath('/compras/facturas-proveedor')
  return { success: true }
}
