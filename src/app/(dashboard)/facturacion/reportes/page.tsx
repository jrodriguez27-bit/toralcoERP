import { PageHeader } from '@/components/shared/page-header'
import { ReportsView } from './reports-view'

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes 606/607"
        description="Reportes fiscales de compras y ventas"
      />
      <ReportsView />
    </div>
  )
}
