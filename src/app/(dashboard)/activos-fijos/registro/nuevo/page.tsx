import { prisma } from '@/lib/prisma'
import { AssetForm } from '../asset-form'

export default async function NuevoActivoPage() {
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

  return (
    <div className="space-y-6">
      <AssetForm
        categories={categories.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
        projects={projects.map((p) => ({ value: p.id, label: p.name }))}
        accounts={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
      />
    </div>
  )
}
