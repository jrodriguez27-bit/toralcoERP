'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { createProject, updateProject } from './_actions'
import { useState } from 'react'

interface Props {
  project?: {
    id: string
    code: string
    name: string
    description: string | null
    clientId: string | null
    startDate: string | null
    endDate: string | null
    status: string
  }
  clients: { value: string; label: string }[]
}

export function ProjectForm({ project, clients }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientId, setClientId] = useState(project?.clientId || '')
  const [status, setStatus] = useState(project?.status || 'PLANNING')
  const isEditing = !!project

  const statusOptions = [
    { value: 'PLANNING', label: 'Planificación' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'ON_HOLD', label: 'En Pausa' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('clientId', clientId)
      formData.set('status', status)
      if (isEditing) {
        await updateProject(project.id, formData)
      } else {
        await createProject(formData)
      }
      router.push('/catalogos/proyectos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" defaultValue={project?.code} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" defaultValue={project?.name} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={project?.description || ''} />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <EntitySelect
                value={clientId}
                onValueChange={setClientId}
                options={clients}
                placeholder="Seleccionar cliente..."
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <EntitySelect
                value={status}
                onValueChange={setStatus}
                options={statusOptions}
                placeholder="Seleccionar estado..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={project?.startDate ? project.startDate.split('T')[0] : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={project?.endDate ? project.endDate.split('T')[0] : ''}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Proyecto'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
