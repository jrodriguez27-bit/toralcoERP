import { prisma } from '@/lib/prisma'

interface AuditLogParams {
  userId: string
  action: string
  entity: string
  entityId: string
  changes?: Record<string, { old: unknown; new: unknown }>
  metadata?: Record<string, unknown>
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  changes,
  metadata,
}: AuditLogParams) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  })
}

export function computeChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fields: string[]
): Record<string, { old: unknown; new: unknown }> | null {
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  for (const field of fields) {
    const oldVal = oldData[field]
    const newVal = newData[field]
    if (String(oldVal) !== String(newVal)) {
      changes[field] = { old: oldVal, new: newVal }
    }
  }
  return Object.keys(changes).length > 0 ? changes : null
}
