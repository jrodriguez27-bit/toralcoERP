import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { StockMatrix } from './stock-matrix'

export default async function StockPage() {
  const stocks = await prisma.stock.findMany({
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: { product: { name: 'asc' } },
  })

  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  // Group by product
  const productMap = new Map<
    string,
    {
      id: string
      code: string
      name: string
      unit: string
      minStock: string
      warehouses: Record<string, string>
      total: number
    }
  >()

  for (const stock of stocks) {
    const pid = stock.productId
    if (!productMap.has(pid)) {
      productMap.set(pid, {
        id: stock.product.id,
        code: stock.product.code,
        name: stock.product.name,
        unit: stock.product.unit,
        minStock: stock.product.minStock.toString(),
        warehouses: {},
        total: 0,
      })
    }
    const entry = productMap.get(pid)!
    const qty = Number(stock.quantity.toString())
    entry.warehouses[stock.warehouseId] = stock.quantity.toString()
    entry.total += qty
  }

  const data = Array.from(productMap.values())

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock por Almacen"
        description="Vista matricial de stock por producto y almacen"
      />
      <StockMatrix data={data} warehouses={warehouseOptions} />
    </div>
  )
}
