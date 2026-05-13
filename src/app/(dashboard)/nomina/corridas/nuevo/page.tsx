import { PageHeader } from '@/components/shared/page-header'
import { PayrollRunForm } from '../payroll-run-form'

export default function NuevaCorridaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nueva Corrida de Nómina" description="Crear una nueva corrida de nómina" />
      <PayrollRunForm />
    </div>
  )
}
