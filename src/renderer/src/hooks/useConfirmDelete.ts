import { useState, useCallback } from 'react'

export interface ConfirmDeleteState {
  pendingId: string | null
  pendingMessage?: string
  anchorRect: DOMRect | null
  requestDelete: (id: string, rect: DOMRect, message?: string) => void
  confirmDelete: () => void
  cancelDelete: () => void
}

export function useConfirmDelete(onDelete: (id: string) => void): ConfirmDeleteState {
  const [pending, setPending] = useState<{
    id: string
    message?: string
    anchorRect: DOMRect
  } | null>(null)

  const requestDelete = useCallback((id: string, rect: DOMRect, message?: string) => {
    setPending({ id, message, anchorRect: rect })
  }, [])

  const confirmDelete = useCallback(() => {
    if (pending) {
      onDelete(pending.id)
      setPending(null)
    }
  }, [pending, onDelete])

  const cancelDelete = useCallback(() => {
    setPending(null)
  }, [])

  return {
    pendingId: pending?.id ?? null,
    pendingMessage: pending?.message,
    anchorRect: pending?.anchorRect ?? null,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
