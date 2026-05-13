'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { DataTable, Column } from '@/components/shared/data-table'
import { formatDateTime } from '@/lib/utils'
import { getAuditLogs } from './_actions'
import { Search } from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  changes: string | null
  createdAt: string
}

interface AuditViewProps {
  initialData: {
    logs: AuditLog[]
    totalCount: number
    page: number
    pageSize: number
  }
  filterOptions: {
    users: { value: string; label: string }[]
    entities: { value: string; label: string }[]
    actions: { value: string; label: string }[]
  }
}

export function AuditView({ initialData, filterOptions }: AuditViewProps) {
  const [data, setData] = useState(initialData)
  const [userId, setUserId] = useState('')
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const fetchLogs = (newPage?: number) => {
    const currentPage = newPage ?? page
    startTransition(async () => {
      const result = await getAuditLogs({
        userId: userId || undefined,
        entity: entity || undefined,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        pageSize: 20,
      })
      setData(result)
      setPage(currentPage)
    })
  }

  const handleFilter = () => {
    setPage(1)
    fetchLogs(1)
  }

  const handleClear = () => {
    setUserId('')
    setEntity('')
    setAction('')
    setStartDate('')
    setEndDate('')
    setPage(1)
    startTransition(async () => {
      const result = await getAuditLogs({ page: 1, pageSize: 20 })
      setData(result)
    })
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'userName',
      label: 'Usuario',
    },
    {
      key: 'action',
      label: 'Accion',
    },
    {
      key: 'entity',
      label: 'Entidad',
    },
    {
      key: 'entityId',
      label: 'ID Entidad',
      render: (row) => (
        <span className="font-mono text-xs">{row.entityId.slice(0, 12)}...</span>
      ),
    },
    {
      key: 'changes',
      label: 'Cambios',
      render: (row) => {
        if (!row.changes) return '-'
        const text = row.changes
        return (
          <span className="text-xs font-mono max-w-[200px] truncate block" title={text}>
            {text.length > 60 ? text.slice(0, 60) + '...' : text}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Usuario</Label>
              <EntitySelect
                value={userId}
                onValueChange={setUserId}
                placeholder="Todos"
                options={filterOptions.users}
              />
            </div>
            <div>
              <Label>Entidad</Label>
              <EntitySelect
                value={entity}
                onValueChange={setEntity}
                placeholder="Todas"
                options={filterOptions.entities}
              />
            </div>
            <div>
              <Label>Accion</Label>
              <EntitySelect
                value={action}
                onValueChange={setAction}
                placeholder="Todas"
                options={filterOptions.actions}
              />
            </div>
            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} disabled={isPending}>
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isPending}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data.logs}
        totalCount={data.totalCount}
        page={data.page}
        pageSize={data.pageSize}
        searchPlaceholder="Buscar en auditoria..."
      />
    </div>
  )
}
