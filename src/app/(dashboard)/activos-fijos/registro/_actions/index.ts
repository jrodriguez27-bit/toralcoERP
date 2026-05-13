'use server'

import { prisma } from '@/lib/prisma'
import { assetCategorySchema, fixedAssetSchema } from '@/lib/validations/activos-fijos'
import { logAudit } from '@/lib/services/audit.service'
import { createJournalEntry } from '@/lib/services/accounting.service'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'

// ============================================================
// CATEGORIAS
// ============================================================

export async function createAssetCategory(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = assetCategorySchema.parse({
    ...raw,
    usefulLifeMonths: Number(raw.usefulLifeMonths),
  })

  const category = await prisma.fixedAssetCategory.create({
    data: {
      code: data.code,
      name: data.name,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod,
      depreciationAccountId: data.depreciationAccountId || null,
      expenseAccountId: data.expenseAccountId || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'FixedAssetCategory',
    entityId: category.id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true, id: category.id }
}

export async function updateAssetCategory(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = assetCategorySchema.parse({
    ...raw,
    usefulLifeMonths: Number(raw.usefulLifeMonths),
  })

  await prisma.fixedAssetCategory.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      usefulLifeMonths: data.usefulLifeMonths,
      depreciationMethod: data.depreciationMethod,
      depreciationAccountId: data.depreciationAccountId || null,
      expenseAccountId: data.expenseAccountId || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'FixedAssetCategory',
    entityId: id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true }
}

export async function deleteAssetCategory(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const hasAssets = await prisma.fixedAsset.count({ where: { categoryId: id } })
  if (hasAssets > 0) {
    throw new Error('No se puede eliminar una categoria con activos asignados')
  }

  await prisma.fixedAssetCategory.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'FixedAssetCategory',
    entityId: id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true }
}

// ============================================================
// ACTIVOS FIJOS
// ============================================================

export async function createFixedAsset(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = fixedAssetSchema.parse({
    ...raw,
    usefulLifeMonths: Number(raw.usefulLifeMonths),
  })

  const acquisitionCost = new Decimal(data.acquisitionCost)
  const residualValue = new Decimal(data.residualValue || '0')
  const bookValue = acquisitionCost.minus(residualValue)

  const asset = await prisma.fixedAsset.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      projectId: data.projectId || null,
      accountId: data.accountId || null,
      acquisitionDate: new Date(data.acquisitionDate),
      acquisitionCost: acquisitionCost.toFixed(2),
      residualValue: residualValue.toFixed(2),
      usefulLifeMonths: data.usefulLifeMonths,
      accumulatedDepreciation: '0',
      bookValue: bookValue.toFixed(2),
      location: data.location || null,
      serialNumber: data.serialNumber || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'FixedAsset',
    entityId: asset.id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true, id: asset.id }
}

export async function updateFixedAsset(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const raw = Object.fromEntries(formData.entries())
  const data = fixedAssetSchema.parse({
    ...raw,
    usefulLifeMonths: Number(raw.usefulLifeMonths),
  })

  const existing = await prisma.fixedAsset.findUnique({ where: { id } })
  if (!existing) throw new Error('Activo no encontrado')
  if (existing.status === 'DISPOSED') {
    throw new Error('No se puede editar un activo dado de baja')
  }

  const acquisitionCost = new Decimal(data.acquisitionCost)
  const residualValue = new Decimal(data.residualValue || '0')
  const accumulatedDepreciation = new Decimal(existing.accumulatedDepreciation.toString())
  const bookValue = acquisitionCost.minus(residualValue).minus(accumulatedDepreciation)

  await prisma.fixedAsset.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      projectId: data.projectId || null,
      accountId: data.accountId || null,
      acquisitionDate: new Date(data.acquisitionDate),
      acquisitionCost: acquisitionCost.toFixed(2),
      residualValue: residualValue.toFixed(2),
      usefulLifeMonths: data.usefulLifeMonths,
      bookValue: bookValue.toFixed(2),
      location: data.location || null,
      serialNumber: data.serialNumber || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'FixedAsset',
    entityId: id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true }
}

export async function deleteFixedAsset(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const existing = await prisma.fixedAsset.findUnique({ where: { id } })
  if (!existing) throw new Error('Activo no encontrado')

  const hasDepreciation = await prisma.depreciationEntry.count({ where: { assetId: id } })
  if (hasDepreciation > 0) {
    throw new Error('No se puede eliminar un activo con depreciaciones registradas')
  }

  await prisma.fixedAsset.delete({ where: { id } })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'FixedAsset',
    entityId: id,
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true }
}

export async function disposeAsset(
  id: string,
  data: { disposalDate: string; disposalAmount: string }
) {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const asset = await prisma.fixedAsset.findUnique({
    where: { id },
    include: { category: true, account: true },
  })
  if (!asset) throw new Error('Activo no encontrado')
  if (asset.status === 'DISPOSED') throw new Error('Activo ya dado de baja')

  const bookValue = new Decimal(asset.bookValue.toString())
  const disposalAmount = new Decimal(data.disposalAmount || '0')
  const gainLoss = disposalAmount.minus(bookValue)

  // Create journal entry for disposal
  const lines: { accountId: string; description: string; debit: string; credit: string }[] = []

  // Debit: Accumulated Depreciation (remove from balance)
  if (asset.category.depreciationAccountId) {
    const accDep = new Decimal(asset.accumulatedDepreciation.toString())
    if (accDep.gt(0)) {
      lines.push({
        accountId: asset.category.depreciationAccountId,
        description: `Dep. acumulada - Baja activo ${asset.code}`,
        debit: accDep.toFixed(2),
        credit: '0',
      })
    }
  }

  // Credit: Asset account (remove asset)
  if (asset.accountId) {
    lines.push({
      accountId: asset.accountId,
      description: `Baja activo ${asset.code}`,
      debit: '0',
      credit: new Decimal(asset.acquisitionCost.toString()).toFixed(2),
    })
  }

  // Gain or loss entry
  if (lines.length >= 2) {
    // Balance the entry with gain/loss
    if (gainLoss.gte(0) && asset.category.expenseAccountId) {
      lines.push({
        accountId: asset.category.expenseAccountId,
        description: `Ganancia por baja activo ${asset.code}`,
        debit: disposalAmount.toFixed(2),
        credit: gainLoss.toFixed(2),
      })
    } else if (gainLoss.lt(0) && asset.category.expenseAccountId) {
      lines.push({
        accountId: asset.category.expenseAccountId,
        description: `Perdida por baja activo ${asset.code}`,
        debit: gainLoss.abs().toFixed(2),
        credit: '0',
      })
      // Cash/receivable for disposal amount
      if (disposalAmount.gt(0)) {
        lines.push({
          accountId: asset.accountId || asset.category.expenseAccountId,
          description: `Ingreso por baja activo ${asset.code}`,
          debit: disposalAmount.toFixed(2),
          credit: '0',
        })
      }
    }
  }

  let journalEntryId: string | undefined
  if (lines.length >= 2) {
    journalEntryId = await createJournalEntry({
      date: new Date(data.disposalDate),
      description: `Baja de activo fijo ${asset.code} - ${asset.name}`,
      type: 'AUTOMATIC',
      referenceType: 'FIXED_ASSET_DISPOSAL',
      referenceId: id,
      lines,
    })
  }

  await prisma.fixedAsset.update({
    where: { id },
    data: {
      status: 'DISPOSED',
      disposalDate: new Date(data.disposalDate),
      disposalAmount: disposalAmount.toFixed(2),
      disposalGainLoss: gainLoss.toFixed(2),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DISPOSE',
    entity: 'FixedAsset',
    entityId: id,
    metadata: { disposalAmount: disposalAmount.toFixed(2), gainLoss: gainLoss.toFixed(2), journalEntryId },
  })

  revalidatePath('/activos-fijos/registro')
  return { success: true }
}
