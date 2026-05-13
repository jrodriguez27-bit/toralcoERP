import { PageHeader } from '@/components/shared/page-header'
import { MayorView } from './mayor-view'
import { getAccountOptions } from './_actions'

export default async function MayorPage() {
  const accounts = await getAccountOptions()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mayor General"
        description="Consulta de movimientos por cuenta contable"
      />
      <MayorView accounts={accounts} />
    </div>
  )
}
