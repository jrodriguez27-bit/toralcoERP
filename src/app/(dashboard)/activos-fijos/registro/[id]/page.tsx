import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AssetForm } from '../asset-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'

interface Props {
  params: { id: string }
}

export default async function AssetDetailPage({ params }: Props) {
  const asset = await prisma.fixedAsset.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      depreciationEntries: {
        include: { run: { select: { period: true, runDate: true } } },
        orderBy: { createdAt: 'desc' },
        take: 24,
      },
      maintenances: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!asset) return notFound()

  const [categories, projects, accounts] = await Promise.all([
    prisma.fixedAssetCategory.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.accountCatalog.findMany({
      where: { isActive: true, acceptsEntries: true, type: 'ASSET' },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
  ])

  const serializedAsset = {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    description: asset.description,
    categoryId: asset.categoryId,
    projectId: asset.projectId,
    accountId: asset.accountId,
    acquisitionDate: asset.acquisitionDate.toISOString(),
    acquisitionCost: asset.acquisitionCost.toString(),
    residualValue: asset.residualValue.toString(),
    usefulLifeMonths: asset.usefulLifeMonths,
    accumulatedDepreciation: asset.accumulatedDepreciation.toString(),
    bookValue: asset.bookValue.toString(),
    status: asset.status,
    location: asset.location,
    serialNumber: asset.serialNumber,
  }

  const maintenanceTypeLabels: Record<string, string> = {
    PREVENTIVE: 'Preventivo',
    CORRECTIVE: 'Correctivo',
  }

  return (
    <div className="space-y-6">
      <AssetForm
        asset={serializedAsset}
        categories={categories.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
        projects={projects.map((p) => ({ value: p.id, label: p.name }))}
        accounts={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
      />

      {/* Depreciation History */}
      {asset.depreciationEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Depreciacion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Fecha Corrida</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asset.depreciationEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.run.period}</TableCell>
                      <TableCell>{formatDate(entry.run.runDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.amount.toString())}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      {asset.maintenances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asset.maintenances.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{maintenanceTypeLabels[m.type] || m.type}</TableCell>
                      <TableCell>{m.description}</TableCell>
                      <TableCell>{m.scheduledDate ? formatDate(m.scheduledDate) : '-'}</TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                      <TableCell className="text-right">{formatCurrency(m.cost.toString())}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
