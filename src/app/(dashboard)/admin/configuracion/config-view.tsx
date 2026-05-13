'use client'

import { useState, useTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable, Column } from '@/components/shared/data-table'
import { EntitySelect } from '@/components/shared/entity-select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  updateCompany, createUser, updateUser, toggleUserActive, updateFiscalConfig,
} from './_actions'
import { Save, Plus, Pencil, UserCheck, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CompanyData {
  id: string
  name: string
  rnc: string
  address: string
  phone: string
  email: string
  website: string
}

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface FiscalConfigData {
  id: string
  key: string
  value: string
  description: string
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'CONTADOR', label: 'Contador' },
  { value: 'COMPRAS', label: 'Compras' },
  { value: 'ALMACEN', label: 'Almacen' },
  { value: 'RRHH', label: 'RRHH' },
  { value: 'VENTAS', label: 'Ventas' },
  { value: 'PROYECTOS', label: 'Proyectos' },
  { value: 'VIEWER', label: 'Visor' },
]

interface ConfigViewProps {
  company: CompanyData | null
  users: UserData[]
  fiscalConfigs: FiscalConfigData[]
}

export function ConfigView({ company, users, fiscalConfigs }: ConfigViewProps) {
  return (
    <Tabs defaultValue="empresa" className="space-y-4">
      <TabsList>
        <TabsTrigger value="empresa">Empresa</TabsTrigger>
        <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        <TabsTrigger value="fiscal">Parametros Fiscales</TabsTrigger>
      </TabsList>

      <TabsContent value="empresa">
        <EmpresaTab company={company} />
      </TabsContent>
      <TabsContent value="usuarios">
        <UsuariosTab users={users} />
      </TabsContent>
      <TabsContent value="fiscal">
        <FiscalTab configs={fiscalConfigs} />
      </TabsContent>
    </Tabs>
  )
}

// ===== Empresa Tab =====
function EmpresaTab({ company }: { company: CompanyData | null }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateCompany(formData)
        setMessage('Datos de empresa guardados correctamente')
        router.refresh()
      } catch (err: any) {
        setMessage('Error: ' + err.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={company?.name ?? ''} required />
          </div>
          <div>
            <Label htmlFor="rnc">RNC</Label>
            <Input id="rnc" name="rnc" defaultValue={company?.rnc ?? ''} required />
          </div>
          <div>
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" name="address" defaultValue={company?.address ?? ''} />
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" defaultValue={company?.phone ?? ''} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={company?.email ?? ''} />
          </div>
          {message && (
            <p className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ===== Usuarios Tab =====
function UsuariosTab({ users }: { users: UserData[] }) {
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<UserData | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createUser(formData)
        setShowCreate(false)
        setMessage('')
        router.refresh()
      } catch (err: any) {
        setMessage('Error: ' + err.message)
      }
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editUser) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateUser(editUser.id, formData)
        setEditUser(null)
        setMessage('')
        router.refresh()
      } catch (err: any) {
        setMessage('Error: ' + err.message)
      }
    })
  }

  const handleToggle = () => {
    if (!confirmToggle) return
    startTransition(async () => {
      await toggleUserActive(confirmToggle.id)
      setConfirmToggle(null)
      router.refresh()
    })
  }

  const columns: Column<UserData>[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Rol',
      render: (row) => {
        const roleLabel = ROLES.find((r) => r.value === row.role)?.label ?? row.role
        return <Badge variant="secondary">{roleLabel}</Badge>
      },
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (row) => (
        <Badge variant={row.isActive ? 'default' : 'destructive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditUser(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setConfirmToggle(row)}>
            {row.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input name="password" type="password" required minLength={6} />
              </div>
              <div>
                <Label>Rol</Label>
                <EntitySelect
                  options={ROLES}
                  onValueChange={(v) => {
                    const input = document.querySelector<HTMLInputElement>('input[name="role"]')
                    if (input) input.value = v
                  }}
                  placeholder="Seleccionar rol"
                />
                <input type="hidden" name="role" />
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={users}
        totalCount={users.length}
        page={1}
        pageSize={100}
        searchPlaceholder="Buscar usuarios..."
      />

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input name="name" defaultValue={editUser.name ?? ''} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editUser.email} required />
              </div>
              <div>
                <Label>Nueva Contrasena (dejar vacio para no cambiar)</Label>
                <Input name="password" type="password" />
              </div>
              <div>
                <Label>Rol</Label>
                <EntitySelect
                  value={editUser.role}
                  options={ROLES}
                  onValueChange={(v) => {
                    const input = document.querySelector<HTMLInputElement>('#edit-role')
                    if (input) input.value = v
                  }}
                  placeholder="Seleccionar rol"
                />
                <input type="hidden" name="role" id="edit-role" defaultValue={editUser.role} />
              </div>
              {message && <p className="text-sm text-red-600">{message}</p>}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Confirm */}
      <ConfirmDialog
        open={!!confirmToggle}
        onOpenChange={(open) => !open && setConfirmToggle(null)}
        title={confirmToggle?.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
        description={
          confirmToggle?.isActive
            ? `Se desactivara el acceso de ${confirmToggle?.name || confirmToggle?.email}. No podra iniciar sesion.`
            : `Se reactivara el acceso de ${confirmToggle?.name || confirmToggle?.email}.`
        }
        confirmLabel={confirmToggle?.isActive ? 'Desactivar' : 'Activar'}
        onConfirm={handleToggle}
        variant={confirmToggle?.isActive ? 'destructive' : 'default'}
      />
    </div>
  )
}

// ===== Fiscal Tab =====
function FiscalTab({ configs }: { configs: FiscalConfigData[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const router = useRouter()

  const handleSave = (id: string) => {
    startTransition(async () => {
      await updateFiscalConfig(id, editValue)
      setEditingId(null)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametros Fiscales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Clave</th>
                <th className="p-3 text-left font-medium">Valor</th>
                <th className="p-3 text-left font-medium">Descripcion</th>
                <th className="p-3 text-left font-medium w-[100px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No hay parametros fiscales configurados
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="border-b">
                    <td className="p-3 font-mono text-xs">{config.key}</td>
                    <td className="p-3">
                      {editingId === config.id ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 w-40"
                          autoFocus
                        />
                      ) : (
                        config.value
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{config.description}</td>
                    <td className="p-3">
                      {editingId === config.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSave(config.id)}
                            disabled={isPending}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(config.id)
                            setEditValue(config.value)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
