import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  message?: string
  anchorRect: DOMRect | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteDialog({
  message = 'Delete? This cannot be undone.',
  anchorRect,
  onConfirm,
  onCancel,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const mountedRef = useRef(false)

  // Mark as mounted after a tick so the triggering click doesn't dismiss us
  useEffect(() => {
    const id = setTimeout(() => {
      mountedRef.current = true
    }, 10)
    return () => clearTimeout(id)
  }, [])

  useLayoutEffect(() => {
    if (!anchorRect || !popoverRef.current) return
    const el = popoverRef.current
    const pad = 8
    const popW = el.offsetWidth
    const popH = el.offsetHeight

    let top = anchorRect.bottom + 6
    let left = anchorRect.left + anchorRect.width / 2 - popW / 2

    if (top + popH > window.innerHeight - pad) {
      top = anchorRect.top - popH - 6
    }
    if (left < pad) left = pad
    if (left + popW > window.innerWidth - pad) left = window.innerWidth - pad - popW

    setPos({ top, left })
  }, [anchorRect])

  // Dismiss on outside click or Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!mountedRef.current) return
      if (popoverRef.current?.contains(e.target as Node)) return
      onCancel()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] bg-[var(--bg-surface)] border border-slate-200 dark:border-white/[0.12] rounded-lg shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] px-3 py-2.5 w-56"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}
    >
      <p className="text-[12px] text-slate-600 dark:text-white/60 mb-2.5 leading-snug">
        {message}
      </p>
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-[#f0f0f0] transition-colors"
        >
          Delete
        </button>
      </div>
    </div>,
    document.body
  )
}
