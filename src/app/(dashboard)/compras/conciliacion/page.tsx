import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'

export default function ConciliacionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Conciliación Bancaria" description="Conciliación bancaria" />
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Módulo en construcción</p>
        </CardContent>
      </Card>
    </div>
  )
}
