import { PageHeader } from '@/components/shared/page-header'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCompany, getUsers, getFiscalConfigs } from './_actions'
import { ConfigView } from './config-view'

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [company, users, fiscalConfigs] = await Promise.all([
    getCompany(),
    getUsers(),
    getFiscalConfigs(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracion" description="Configuracion del sistema" />
      <ConfigView
        company={company}
        users={users}
        fiscalConfigs={fiscalConfigs}
      />
    </div>
  )
}
