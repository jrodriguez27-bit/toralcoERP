'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/shared/entity-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { createFixedAsset, updateFixedAsset, disposeAsset } from './_actions'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AssetData {
  id: string
  code: string
  name: string
  description: string | null
  categoryId: string
  projectId: string | null
  accountId: string | null
  acquisitionDate: string
  acquisitionCost: string
  residualValue: string
  usefulLifeMonths: number
  accumulatedDepreciation: string
  bookValue: string
  status: string
  location: string | null
  serialNumber: string | null
}

interface Props {
  asset?: AssetData
  categories: { value: string; label: string }[]
  projects: { value: string; label: string }[]
  accounts: { value: string; label: string }[]
}

export function AssetForm({ asset, categories, projects, accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoryId, setCategoryId] = useState(asset?.categoryId || '')
  const [projectId, setProjectId] = useState(asset?.projectId || '')
  const [accountId, setAccountId] = useState(asset?.accountId || '')
  const [showDisposeDialog, setShowDisposeDialog] = useState(false)
  const [disposeDate, setDisposeDate] = useState('')
  const [disposeAmount, setDisposeAmount] = useState('0')
  const [disposeLoading, setDisposeLoading] = useState(false)

  const isEditing = !!asset
  const isDisposed = asset?.status === 'DISPOSED'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('categoryId', categoryId)
      formData.set('projectId', projectId || '')
      formData.set('accountId', accountId || '')

      if (isEditing) {
        await updateFixedAsset(asset.id, formData)
        router.refresh()
      } else {
        const result = await createFixedAsset(formData)
        router.push(`/activos-fijos/registro/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleDispose = async () => {
    if (!asset || !disposeDate) return
    setDisposeLoading(true)
    setError('')

    try {
      await disposeAsset(asset.id, {
        disposalDate: disposeDate,
        disposalAmount: disposeAmount || '0',
      })
      setShowDisposeDialog(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al dar de baja')
    } finally {
      setDisposeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {isEditing ? `Activo ${asset.code}` : 'Nuevo Activo Fijo'}
            </CardTitle>
            {asset && <StatusBadge status={asset.status} />}
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
                  defaultValue={asset?.code || ''}
                  disabled={isDisposed}
                  placeholder="AF-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={asset?.name || ''}
                  disabled={isDisposed}
                  placeholder="Nombre del activo"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <EntitySelect
                  value={categoryId}
                  onValueChange={setCategoryId}
                  options={categories}
                  placeholder="Seleccionar categoria..."
                  disabled={isDisposed}
                />
                <input type="hidden" name="categoryId" value={categoryId} />
              </div>
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <EntitySelect
                  value={projectId}
                  onValueChange={setProjectId}
                  options={projects}
                  placeholder="Seleccionar proyecto..."
                  disabled={isDisposed}
                />
              </div>
              <div className="space-y-2">
                <Label>Cuenta Contable</Label>
                <EntitySelect
                  value={accountId}
                  onValueChange={setAccountId}
                  options={accounts}
                  placeholder="Seleccionar cuenta..."
                  disabled={isDisposed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Fecha de Adquisicion *</Label>
                <Input
                  id="acquisitionDate"
                  name="acquisitionDate"
                  type="date"
                  required
                  defaultValue={asset?.acquisitionDate?.split('T')[0] || ''}
                  disabled={isDisposed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionCost">Costo de Adquisicion *</Label>
                <Input
                  id="acquisitionCost"
                  name="acquisitionCost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={asset?.acquisitionCost || ''}
                  disabled={isDisposed}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residualValue">Valor Residual</Label>
                <Input
                  id="residualValue"
                  name="residualValue"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={asset?.residualValue || '0'}
                  disabled={isDisposed}
                  placeholder="0.00"
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
                  defaultValue={asset?.usefulLifeMonths || ''}
                  disabled={isDisposed}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Numero de Serie</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  defaultValue={asset?.serialNumber || ''}
                  disabled={isDisposed}
                  placeholder="SN-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicacion</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={asset?.location || ''}
                  disabled={isDisposed}
                  placeholder="Oficina principal"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={asset?.description || ''}
                  disabled={isDisposed}
                  rows={3}
                />
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-md bg-muted p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dep. Acumulada</p>
                  <p className="text-lg font-semibold">{formatCurrency(asset.accumulatedDepreciation)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor en Libros</p>
                  <p className="text-lg font-semibold">{formatCurrency(asset.bookValue)}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
              {!isDisposed && (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Activo'}
                </Button>
              )}
              {isEditing && !isDisposed && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDisposeDialog(true)}
                >
                  Dar de Baja
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => router.push('/activos-fijos/registro')}>
                {isEditing ? 'Volver a Lista' : 'Cancelar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dispose Dialog */}
      <Dialog open={showDisposeDialog} onOpenChange={setShowDisposeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de Baja Activo</DialogTitle>
            <DialogDescription>
              Registre la fecha y monto de disposicion del activo. Se calculara automaticamente la ganancia o perdida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disposeDate">Fecha de Baja *</Label>
              <Input
                id="disposeDate"
                type="date"
                value={disposeDate}
                onChange={(e) => setDisposeDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disposeAmount">Monto de Disposicion</Label>
              <Input
                id="disposeAmount"
                type="number"
                step="0.01"
                min="0"
                value={disposeAmount}
                onChange={(e) => setDisposeAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {asset && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>Valor en libros actual: <strong>{formatCurrency(asset.bookValue)}</strong></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisposeDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispose}
              disabled={disposeLoading || !disposeDate}
            >
              {disposeLoading ? 'Procesando...' : 'Confirmar Baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
