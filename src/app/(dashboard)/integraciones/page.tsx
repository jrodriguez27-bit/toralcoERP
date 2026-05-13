import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const integrations = [
  { name: 'Alegra', description: 'Contabilidad en la nube' },
  { name: 'Procore', description: 'Gestión de proyectos de construcción' },
  { name: 'Pressto', description: 'Facturación electrónica' },
  { name: 'Bancos', description: 'Conexión bancaria' },
  { name: 'DGII', description: 'Dirección General de Impuestos Internos' },
  { name: 'TSS', description: 'Tesorería de la Seguridad Social' },
]

export default function IntegracionesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Integraciones" description="Conexiones con sistemas externos" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
              <Badge variant="secondary">Próximamente</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{integration.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
