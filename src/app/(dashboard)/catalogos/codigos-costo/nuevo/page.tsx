import { prisma } from '@/lib/prisma'
import { CostCodeForm } from '../cost-code-form'

export default async function NewCostCodePage() {
  const accounts = await prisma.accountCatalog.findMany({
    where: { deletedAt: null, acceptsEntries: true },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <CostCodeForm accounts={accountOptions} />
    </div>
  )
}
