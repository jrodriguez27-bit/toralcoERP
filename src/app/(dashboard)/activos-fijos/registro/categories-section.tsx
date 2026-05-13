'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EntitySelect } from '@/components/shared/entity-select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { createAssetCategory, updateAssetCategory, deleteAssetCategory } from './_actions'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Category {
  id: string
  code: string
  name: string
  usefulLifeMonths: number
  depreciationMethod: string
  depreciationAccountId: string | null
  expenseAccountId: string | null
  assetCount: number
}

interface Props {
  categories: Category[]
}

export function CategoriesSection({ categories }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [depMethod, setDepMethod] = useState('STRAIGHT_LINE')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('depreciationMethod', depMethod)
      if (editingId) {
        await updateAssetCategory(editingId, formData)
      } else {
        await createAssetCategory(formData)
      }
      setShowForm(false)
      setEditingId(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id)
    setDepMethod(cat.depreciationMethod)
    setShowForm(true)
  }

  const editing = editingId ? categories.find((c) => c.id === editingId) : null

  const methodOptions = [
    { value: 'STRAIGHT_LINE', label: 'Linea Recta' },
    { value: 'DECLINING_BALANCE', label: 'Saldo Decreciente' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
          }}
          disabled={showForm}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoria
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Editar Categoria' : 'Nueva Categoria'}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setError('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="code">Codigo *</Label>
                  <Input
                    id="code"
                    name="code"
                    required
                    defaultValue={editing?.code || ''}
                    placeholder="EQ-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editing?.name || ''}
                    placeholder="Equipos de Oficina"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usefulLifeMonths">Vida Util (meses) *</Label>
                  <Input
                    id="usefulLifeMonths"
                    name="usefulLifeMonths"
                    type="number"
                    min="1"
                    required
                    defaultValue={editing?.usefulLifeMonths || ''}
                    placeholder="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Metodo de Depreciacion</Label>
                  <EntitySelect
                    value={depMethod}
                    onValueChange={setDepMethod}
                    options={methodOptions}
                    placeholder="Seleccionar metodo..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depreciationAccountId">Cuenta Dep. Acumulada</Label>
                  <Input
                    id="depreciationAccountId"
                    name="depreciationAccountId"
                    defaultValue={editing?.depreciationAccountId || ''}
                    placeholder="ID cuenta (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAccountId">Cuenta Gasto Depreciacion</Label>
                  <Input
                    id="expenseAccountId"
                    name="expenseAccountId"
                    defaultValue={editing?.expenseAccountId || ''}
                    placeholder="ID cuenta (opcional)"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setError('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Vida Util</TableHead>
              <TableHead>Metodo</TableHead>
              <TableHead className="text-center">Activos</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.code}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.usefulLifeMonths} meses</TableCell>
                <TableCell>
                  {cat.depreciationMethod === 'STRAIGHT_LINE'
                    ? 'Linea Recta'
                    : 'Saldo Decreciente'}
                </TableCell>
                <TableCell className="text-center">{cat.assetCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => setDeleteId(cat.id)}
                      disabled={cat.assetCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay categorias registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Categoria"
        description="Esta accion no se puede deshacer. La categoria sera eliminada permanentemente."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteAssetCategory(deleteId)
            setDeleteId(null)
            router.refresh()
          }
        }}
      />
    </div>
  )
}
