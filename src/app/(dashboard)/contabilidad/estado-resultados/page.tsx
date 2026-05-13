import { PageHeader } from '@/components/shared/page-header'
import { IncomeStatementView } from './income-statement-view'

export default function EstadoResultadosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado de Resultados"
        description="Ingresos, costos y gastos del periodo"
      />
      <IncomeStatementView />
    </div>
  )
}
