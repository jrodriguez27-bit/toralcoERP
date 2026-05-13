import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Decimal from 'decimal.js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number | Decimal): string {
  const num = new Decimal(amount).toNumber()
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es })
}

export async function generateSequentialNumber(
  prisma: import('@prisma/client').PrismaClient,
  type: string,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear()

  const sequence = await prisma.documentSequence.upsert({
    where: { type },
    create: { type, prefix, currentNumber: 1, year },
    update: { currentNumber: { increment: 1 } },
  })

  // If year changed, reset
  if (sequence.year !== year) {
    await prisma.documentSequence.update({
      where: { type },
      data: { currentNumber: 1, year },
    })
    return `${prefix}-${year}-0001`
  }

  const num = sequence.currentNumber.toString().padStart(4, '0')
  return `${prefix}-${year}-${num}`
}

export function serializeDecimal(value: unknown): string {
  if (value === null || value === undefined) return '0'
  return value.toString()
}

export function parseSearchParams(searchParams: { [key: string]: string | string[] | undefined }) {
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 20
  const search = (searchParams.search as string) || ''
  const sortBy = (searchParams.sortBy as string) || 'createdAt'
  const sortDir = (searchParams.sortDir as string) === 'asc' ? 'asc' : 'desc'

  return { page, pageSize, search, sortBy, sortDir, skip: (page - 1) * pageSize }
}
