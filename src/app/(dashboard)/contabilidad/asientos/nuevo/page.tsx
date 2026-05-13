import { prisma } from '@/lib/prisma'
import { JournalEntryForm } from '../journal-entry-form'

export default async function NuevoAsientoPage() {
  const accounts = await prisma.accountCatalog.findMany({
    where: {
      acceptsEntries: true,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <JournalEntryForm accounts={accountOptions} />
    </div>
  )
}
