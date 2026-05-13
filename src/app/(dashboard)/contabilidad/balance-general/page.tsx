import { PageHeader } from '@/components/shared/page-header'
import { BalanceSheetView } from './balance-sheet-view'

export default function BalanceGeneralPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance General"
        description="Estado de situacion financiera a una fecha determinada"
      />
      <BalanceSheetView />
    </div>
  )
}
