import { prisma } from '@/lib/prisma'
import { parseSearchParams } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { AssetsTable } from './assets-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoriesSection } from './categories-section'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ActivosFijosRegistroPage({ searchParams }: Props) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseSearchParams(searchParams)

  const where = {
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { serialNumber: { contains: search, mode: 'insensitive' as const } },
            { category: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [assets, totalCount, categories] = await Promise.all([
    prisma.fixedAsset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.fixedAsset.count({ where }),
    prisma.fixedAssetCategory.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { assets: true } } },
    }),
  ])

  const serializedAssets = assets.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    status: a.status,
    acquisitionDate: a.acquisitionDate.toISOString(),
    acquisitionCost: a.acquisitionCost.toString(),
    accumulatedDepreciation: a.accumulatedDepreciation.toString(),
    bookValue: a.bookValue.toString(),
    category: { id: a.category.id, name: a.category.name },
  }))

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    usefulLifeMonths: c.usefulLifeMonths,
    depreciationMethod: c.depreciationMethod,
    depreciationAccountId: c.depreciationAccountId,
    expenseAccountId: c.expenseAccountId,
    assetCount: c._count.assets,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activos Fijos"
        description="Registro y gestion de activos fijos"
        createHref="/activos-fijos/registro/nuevo"
        createLabel="Nuevo Activo"
      />
      <Tabs defaultValue="activos">
        <TabsList>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="activos" className="mt-4">
          <AssetsTable
            data={serializedAssets}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            search={search}
            sortBy={sortBy}
            sortDir={sortDir as 'asc' | 'desc'}
          />
        </TabsContent>
        <TabsContent value="categorias" className="mt-4">
          <CategoriesSection categories={serializedCategories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
