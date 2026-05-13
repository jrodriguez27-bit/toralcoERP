'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteAccount } from './_actions'

interface Account {
  id: string
  code: string
  name: string
  type: string
  nature: string
  level: number
  acceptsEntries: boolean
}

interface Props {
  data: Account[]
}

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
  EQUITY: 'Capital',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  COST: 'Costo',
}

const NATURE_LABELS: Record<string, string> = {
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
}

export function AccountsTable({ data }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Código</th>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Naturaleza</th>
              <th className="px-4 py-3 text-left font-medium">Acepta Asientos</th>
              <th className="px-4 py-3 text-left font-medium w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((account) => (
              <tr key={account.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-mono" style={{ paddingLeft: `${(account.level - 1) * 24 + 16}px` }}>
                  {account.code}
                </td>
                <td className="px-4 py-3" style={{ paddingLeft: `${(account.level - 1) * 24 + 16}px` }}>
                  <span className={account.level <= 2 ? 'font-semibold' : ''}>
                    {account.name}
                  </span>
                </td>
                <td className="px-4 py-3">{TYPE_LABELS[account.type] || account.type}</td>
                <td className="px-4 py-3">{NATURE_LABELS[account.nature] || account.nature}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      account.acceptsEntries
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {account.acceptsEntries ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/catalogos/cuentas/${account.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => setDeleteId(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay cuentas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar Cuenta"
        description="Esta acción no se puede deshacer. La cuenta será desactivada."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteAccount(deleteId)
            setDeleteId(null)
          }
        }}
      />
    </>
  )
}
