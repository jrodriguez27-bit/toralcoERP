import { PageHeader } from '@/components/shared/page-header'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAuditLogs, getAuditFilterOptions } from './_actions'
import { AuditView } from './audit-view'

export default async function AuditoriaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [data, filterOptions] = await Promise.all([
    getAuditLogs({ page: 1, pageSize: 20 }),
    getAuditFilterOptions(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Log de auditoria del sistema" />
      <AuditView
        initialData={data}
        filterOptions={filterOptions}
      />
    </div>
  )
}
