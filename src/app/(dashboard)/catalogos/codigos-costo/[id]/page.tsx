import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CostCodeForm } from '../cost-code-form'

export default async function EditCostCodePage({ params }: { params: { id: string } }) {
  const [costCode, accounts] = await Promise.all([
    prisma.costCode.findUnique({ where: { id: params.id } }),
    prisma.accountCatalog.findMany({
      where: { deletedAt: null, acceptsEntries: true },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  if (!costCode) notFound()

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <CostCodeForm
        costCode={{
          ...costCode,
        }}
        accounts={accountOptions}
      />
    </div>
  )
}
