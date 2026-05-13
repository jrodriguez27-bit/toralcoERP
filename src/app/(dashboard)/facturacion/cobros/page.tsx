import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { CollectionsTable } from './collections-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CobrosPage({ searchParams }: Props) {
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

  const [collections, totalCount] = await Promise.all([
    prisma.collection.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.collection.count({ where }),
  ])

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: 'Efectivo',
    CHECK: 'Cheque',
    TRANSFER: 'Transferencia',
    CREDIT_CARD: 'Tarjeta de Credito',
  }

  const serialized = collections.map((c) => ({
    id: c.id,
    number: c.number,
    collectionDate: c.collectionDate.toISOString(),
    paymentMethod: PAYMENT_METHOD_LABELS[c.paymentMethod] || c.paymentMethod,
    totalAmount: c.totalAmount.toString(),
    reference: c.reference,
    applicationCount: c._count.applications,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobros"
        description="Gestion de cobros a clientes"
        createHref="/facturacion/cobros/nuevo"
        createLabel="Nuevo Cobro"
      />
      <CollectionsTable
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
