'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
  endpoint: string
  filename?: string
  label?: string
  params?: Record<string, string>
}

export function ExportButton({
  endpoint,
  filename = 'export.xlsx',
  label = 'Exportar Excel',
  params,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const url = new URL(endpoint, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Exportando...' : label}
    </Button>
  )
}
