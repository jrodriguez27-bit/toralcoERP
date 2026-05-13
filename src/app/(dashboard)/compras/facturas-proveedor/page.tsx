import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { InvoicesTable } from './invoices-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function FacturasProveedorPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { supplierInvNumber: { contains: search, mode: 'insensitive' as const } },
            { supplier: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [invoices, totalCount] = await Promise.all([
    prisma.supplierInvoice.findMany({
      where,
      include: { supplier: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.supplierInvoice.count({ where }),
  ])

  const serializedInvoices = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    supplierInvNumber: inv.supplierInvNumber,
    supplierName: inv.supplier.name,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    totalAmount: serializeDecimal(inv.totalAmount),
    balanceDue: serializeDecimal(inv.balanceDue),
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas de Proveedor"
        description="Gestion de facturas de proveedores"
        createHref="/compras/facturas-proveedor/nuevo"
        createLabel="Nueva Factura"
      />
      <InvoicesTable
        data={serializedInvoices}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir as 'asc' | 'desc'}
      />
    </div>
  )
}
