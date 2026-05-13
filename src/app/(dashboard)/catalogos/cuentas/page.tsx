import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { AccountsTable } from './accounts-table'

export default async function AccountsPage() {
  const accounts = await prisma.accountCatalog.findMany({
    where: { deletedAt: null },
    orderBy: { code: 'asc' },
  })

  const serializedAccounts = accounts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan de Cuentas"
        description="Catálogo de cuentas contables"
        createHref="/catalogos/cuentas/nuevo"
        createLabel="Nueva Cuenta"
      />
      <AccountsTable data={serializedAccounts} />
    </div>
  )
}
