import { prisma } from '@/lib/prisma'
import { MaintenanceForm } from '../maintenance-form'

export default async function NuevoMantenimientoPage() {
  const assets = await prisma.fixedAsset.findMany({
    where: { status: { not: 'DISPOSED' } },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })

  const assetOptions = assets.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.name}`,
  }))

  return (
    <div className="space-y-6">
      <MaintenanceForm assets={assetOptions} />
    </div>
  )
}
