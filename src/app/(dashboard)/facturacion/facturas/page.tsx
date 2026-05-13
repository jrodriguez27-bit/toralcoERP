import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { InvoicesTable } from './invoices-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function FacturasPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { ncf: { contains: search, mode: 'insensitive' as const } },
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [invoices, totalCount] = await Promise.all([
    prisma.clientInvoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.clientInvoice.count({ where }),
  ])

  const serialized = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    ncf: inv.ncf,
    ncfType: inv.ncfType,
    clientName: inv.client.name,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    totalAmount: inv.totalAmount.toString(),
    balanceDue: inv.balanceDue.toString(),
    status: inv.status,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Gestion de facturas a clientes"
        createHref="/facturacion/facturas/nuevo"
        createLabel="Nueva Factura"
      />
      <InvoicesTable
        data={serialized}
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
