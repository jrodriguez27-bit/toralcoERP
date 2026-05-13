'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface AuditFilters {
  userId?: string
  entity?: string
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogs(filters: AuditFilters = {}) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const { userId, entity, action, startDate, endDate, page = 1, pageSize = 20 } = filters

  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  if (entity) where.entity = entity
  if (action) where.action = action
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59Z') } : {}),
    }
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name || log.user.email,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      changes: log.changes ? JSON.stringify(log.changes) : null,
      createdAt: log.createdAt.toISOString(),
    })),
    totalCount,
    page,
    pageSize,
  }
}

export async function getAuditFilterOptions() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const [users, entities, actions] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' },
    }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
  ])

  return {
    users: users.map((u) => ({ value: u.id, label: u.name || u.email })),
    entities: entities.map((e) => ({ value: e.entity, label: e.entity })),
    actions: actions.map((a) => ({ value: a.action, label: a.action })),
  }
}
