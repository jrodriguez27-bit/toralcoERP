import { PageHeader } from '@/components/shared/page-header'
import { TrialBalanceView } from './trial-balance-view'
import { getAvailablePeriods } from './_actions'

export default async function BalancePage() {
  const periods = await getAvailablePeriods()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance de Comprobacion"
        description="Resumen de debitos y creditos por cuenta en un periodo"
      />
      <TrialBalanceView periods={periods} />
    </div>
  )
}
