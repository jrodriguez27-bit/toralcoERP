import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AccountForm } from '../account-form'

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const [account, accounts] = await Promise.all([
    prisma.accountCatalog.findUnique({ where: { id: params.id } }),
    prisma.accountCatalog.findMany({
      where: { deletedAt: null, id: { not: params.id } },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  if (!account) notFound()

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <AccountForm
        account={{
          ...account,
        }}
        accounts={accountOptions}
      />
    </div>
  )
}
