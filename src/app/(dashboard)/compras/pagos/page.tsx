import { prisma } from '@/lib/prisma'
import { parseSearchParams, serializeDecimal } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { PaymentsTable } from './payments-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function PagosProveedoresPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { reference: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ])

  const serializedPayments = payments.map((p) => ({
    id: p.id,
    number: p.number,
    paymentDate: p.paymentDate.toISOString(),
    paymentMethod: p.paymentMethod,
    totalAmount: serializeDecimal(p.totalAmount),
    reference: p.reference,
    invoiceCount: p._count.applications,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos a Proveedores"
        description="Gestion de pagos a proveedores"
        createHref="/compras/pagos/nuevo"
        createLabel="Nuevo Pago"
      />
      <PaymentsTable
        data={serializedPayments}
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
