import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { NotasTable } from './notas-table'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function NotasCreditoPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { ncf: { contains: search, mode: 'insensitive' as const } },
            { reason: { contains: search, mode: 'insensitive' as const } },
            { invoice: { number: { contains: search, mode: 'insensitive' as const } } },
            { invoice: { client: { name: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {}),
  }

  const [creditNotes, totalCount] = await Promise.all([
    prisma.creditNote.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.creditNote.count({ where }),
  ])

  const serialized = creditNotes.map((cn) => ({
    id: cn.id,
    number: cn.number,
    ncf: cn.ncf,
    invoiceNumber: cn.invoice.number,
    clientName: cn.invoice.client.name,
    amount: cn.amount.toString(),
    reason: cn.reason,
    createdAt: cn.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas de Credito"
        description="Gestion de notas de credito"
        createHref="/facturacion/notas-credito/nuevo"
        createLabel="Nueva Nota de Credito"
      />
      <NotasTable
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
