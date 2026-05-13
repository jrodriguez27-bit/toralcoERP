import { prisma } from '@/lib/prisma'
import { AccountForm } from '../account-form'

export default async function NewAccountPage() {
  const accounts = await prisma.accountCatalog.findMany({
    where: { deletedAt: null },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <AccountForm accounts={accountOptions} />
    </div>
  )
}
