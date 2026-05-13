'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { postJournalEntryAction, reverseJournalEntry } from '../_actions'
import { CheckCircle, RotateCcw } from 'lucide-react'

interface Props {
  entryId: string
  status: string
}

export function EntryActions({ entryId, status }: Props) {
  const router = useRouter()
  const [showPost, setShowPost] = useState(false)
  const [showReverse, setShowReverse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePost = async () => {
    setLoading(true)
    setError('')
    try {
      await postJournalEntryAction(entryId)
      setShowPost(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al contabilizar')
    } finally {
      setLoading(false)
    }
  }

  const handleReverse = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await reverseJournalEntry(entryId)
      setShowReverse(false)
      router.push(`/contabilidad/asientos/${result.reversingEntryId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reversar')
    } finally {
      setLoading(false)
    }
  }

  if (status !== 'DRAFT' && status !== 'POSTED') return null

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3">
        {status === 'DRAFT' && (
          <Button onClick={() => setShowPost(true)} disabled={loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Contabilizar
          </Button>
        )}
        {status === 'POSTED' && (
          <Button variant="outline" onClick={() => setShowReverse(true)} disabled={loading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reversar
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showPost}
        onOpenChange={() => setShowPost(false)}
        title="Contabilizar Asiento"
        description="Una vez contabilizado, el asiento no podra ser editado. Solo podra ser reversado."
        confirmLabel="Contabilizar"
        onConfirm={handlePost}
      />
      <ConfirmDialog
        open={showReverse}
        onOpenChange={() => setShowReverse(false)}
        title="Reversar Asiento"
        description="Se creara un nuevo asiento con los montos invertidos para anular este asiento."
        confirmLabel="Reversar"
        variant="destructive"
        onConfirm={handleReverse}
      />
    </>
  )
}
