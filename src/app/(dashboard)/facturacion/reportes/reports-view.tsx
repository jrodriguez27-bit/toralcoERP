'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntitySelect } from '@/components/shared/entity-select'
import { getReport606, getReport607 } from './_actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Download } from 'lucide-react'

interface Report606Row {
  id: string
  rnc: string
  supplierName: string
  ncf: string
  invoiceDate: string
  subtotal: string
  itbis: string
  isrRetention: string
  itbisRetention: string
  totalAmount: string
}

interface Report607Row {
  id: string
  rnc: string
  clientName: string
  ncf: string
  ncfType: string
  invoiceDate: string
  subtotal: string
  itbis: string
  totalAmount: string
}

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

export function ReportsView() {
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [loading, setLoading] = useState(false)
  const [data606, setData606] = useState<Report606Row[]>([])
  const [data607, setData607] = useState<Report607Row[]>([])
  const [loaded, setLoaded] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const [r606, r607] = await Promise.all([
        getReport606(Number(year), Number(month)),
        getReport607(Number(year), Number(month)),
      ])
      setData606(r606)
      setData607(r607)
      setLoaded(true)
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    alert('Proximamente: Exportacion de reportes fiscales')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <EntitySelect value={year} onValueChange={setYear} options={YEAR_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label>Mes</Label>
              <EntitySelect value={month} onValueChange={setMonth} options={MONTH_OPTIONS} />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
            {loaded && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loaded && (
        <Tabs defaultValue="606">
          <TabsList>
            <TabsTrigger value="606">606 - Compras ({data606.length})</TabsTrigger>
            <TabsTrigger value="607">607 - Ventas ({data607.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="606">
            <Card>
              <CardHeader>
                <CardTitle>Reporte 606 - Compras y Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RNC/Cedula</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>NCF</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto Facturado</TableHead>
                        <TableHead className="text-right">ITBIS</TableHead>
                        <TableHead className="text-right">Ret. ISR</TableHead>
                        <TableHead className="text-right">Ret. ITBIS</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data606.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            No se encontraron registros para el periodo seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data606.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono">{row.rnc || '-'}</TableCell>
                            <TableCell>{row.supplierName}</TableCell>
                            <TableCell className="font-mono">{row.ncf || '-'}</TableCell>
                            <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.subtotal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.itbis)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.isrRetention)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.itbisRetention)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="607">
            <Card>
              <CardHeader>
                <CardTitle>Reporte 607 - Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RNC/Cedula</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>NCF</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto Facturado</TableHead>
                        <TableHead className="text-right">ITBIS</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data607.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            No se encontraron registros para el periodo seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data607.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono">{row.rnc || '-'}</TableCell>
                            <TableCell>{row.clientName}</TableCell>
                            <TableCell className="font-mono">{row.ncf || '-'}</TableCell>
                            <TableCell>{row.ncfType}</TableCell>
                            <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.subtotal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.itbis)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
