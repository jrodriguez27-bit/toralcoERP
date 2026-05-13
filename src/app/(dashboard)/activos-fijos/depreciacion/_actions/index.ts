'use server'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/services/audit.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'

export async function runDepreciation(period: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  // Validate period format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error('Formato de periodo invalido. Use YYYY-MM')
  }

  // Check if already run for this period
  const existing = await prisma.depreciationRun.findFirst({
    where: { period },
  })
  if (existing) {
    throw new Error(`Ya existe una corrida de depreciacion para el periodo ${period}`)
  }

  // Get all active assets with their categories
  const assets = await prisma.fixedAsset.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true },
  })

  if (assets.length === 0) {
    throw new Error('No hay activos activos para depreciar')
  }

  const entries: { assetId: string; amount: Decimal }[] = []
  let totalAmount = new Decimal(0)

  // Group by category accounts for journal entry
  const accountDebits: Record<string, Decimal> = {} // expense accounts
  const accountCredits: Record<string, Decimal> = {} // depreciation accounts

  for (const asset of assets) {
    const cost = new Decimal(asset.acquisitionCost.toString())
    const residual = new Decimal(asset.residualValue.toString())
    const bookValue = new Decimal(asset.bookValue.toString())
    const usefulLife = asset.usefulLifeMonths

    // Skip if fully depreciated
    if (bookValue.lte(residual) || bookValue.lte(0)) continue

    let depAmount: Decimal

    if (asset.category.depreciationMethod === 'STRAIGHT_LINE') {
      // Straight line: (cost - residual) / usefulLifeMonths
      depAmount = cost.minus(residual).div(usefulLife)
    } else {
      // Declining balance: bookValue * (2 / usefulLifeMonths)
      depAmount = bookValue.times(new Decimal(2).div(usefulLife))
    }

    // Don't depreciate below residual value
    if (bookValue.minus(depAmount).lt(residual)) {
      depAmount = bookValue.minus(residual)
    }

    if (depAmount.lte(0)) continue

    // Round to 2 decimals
    depAmount = new Decimal(depAmount.toFixed(2))

    entries.push({ assetId: asset.id, amount: depAmount })
    totalAmount = totalAmount.plus(depAmount)

    // Accumulate by accounts for journal entry
    const expenseAcct = asset.category.expenseAccountId
    const depAcct = asset.category.depreciationAccountId

    if (expenseAcct) {
      accountDebits[expenseAcct] = (accountDebits[expenseAcct] || new Decimal(0)).plus(depAmount)
    }
    if (depAcct) {
      accountCredits[depAcct] = (accountCredits[depAcct] || new Decimal(0)).plus(depAmount)
    }
  }

  if (entries.length === 0) {
    throw new Error('No hay activos pendientes de depreciacion en este periodo')
  }

  // Create journal entry if accounts are configured
  let journalEntryId: string | undefined
  const journalLines: { accountId: string; description: string; debit: string; credit: string }[] = []

  for (const [accountId, amount] of Object.entries(accountDebits)) {
    journalLines.push({
      accountId,
      description: `Gasto depreciacion periodo ${period}`,
      debit: amount.toFixed(2),
      credit: '0',
    })
  }

  for (const [accountId, amount] of Object.entries(accountCredits)) {
    journalLines.push({
      accountId,
      description: `Dep. acumulada periodo ${period}`,
      debit: '0',
      credit: amount.toFixed(2),
    })
  }

  if (journalLines.length >= 2) {
    const [year, month] = period.split('-').map(Number)
    const runDate = new Date(year, month - 1, 28) // End of month approx

    journalEntryId = await createJournalEntry({
      date: runDate,
      description: `Depreciacion de activos fijos - ${period}`,
      type: 'AUTOMATIC',
      referenceType: 'DEPRECIATION_RUN',
      lines: journalLines,
    })
  }

  // Create depreciation run and entries, update assets
  const run = await prisma.$transaction(async (tx) => {
    const depRun = await tx.depreciationRun.create({
      data: {
        period,
        runDate: new Date(),
        totalAmount: totalAmount.toFixed(2),
        journalEntryId: journalEntryId || null,
        entries: {
          create: entries.map((e) => ({
            assetId: e.assetId,
            amount: e.amount.toFixed(2),
          })),
        },
      },
    })

    // Update each asset's accumulated depreciation and book value
    for (const entry of entries) {
      const asset = assets.find((a) => a.id === entry.assetId)!
      const currentAccDep = new Decimal(asset.accumulatedDepreciation.toString())
      const currentBookValue = new Decimal(asset.bookValue.toString())

      await tx.fixedAsset.update({
        where: { id: entry.assetId },
        data: {
          accumulatedDepreciation: currentAccDep.plus(entry.amount).toFixed(2),
          bookValue: currentBookValue.minus(entry.amount).toFixed(2),
        },
      })
    }

    return depRun
  })

  await logAudit({
    userId: session.user.id,
    action: 'RUN_DEPRECIATION',
    entity: 'DepreciationRun',
    entityId: run.id,
    metadata: { period, totalAmount: totalAmount.toFixed(2), assetCount: entries.length },
  })

  revalidatePath('/activos-fijos/depreciacion')
  revalidatePath('/activos-fijos/registro')
  return { success: true, id: run.id }
}
