import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export interface MoreMenuItem {
  label: string
  icon: ComponentType<{ size: number; className?: string }>
  onClick: (anchorRect: DOMRect) => void
  danger?: boolean
}

interface Props {
  items: MoreMenuItem[]
  size?: number
  className?: string
}

export function MoreMenu({ items, size = 20, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      mountedRef.current = false
      return
    }
    const id = setTimeout(() => {
      mountedRef.current = true
    }, 10)
    return () => clearTimeout(id)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !popRef.current) return
    const anchor = btnRef.current.getBoundingClientRect()
    const el = popRef.current
    const pad = 8
    const popW = el.offsetWidth
    const popH = el.offsetHeight

    let top = anchor.bottom + 4
    let left = anchor.right - popW

    if (top + popH > window.innerHeight - pad) {
      top = anchor.top - popH - 4
    }
    if (left < pad) left = pad
    if (left + popW > window.innerWidth - pad) left = window.innerWidth - pad - popW

    setPos({ top, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!mountedRef.current) return
      if (popRef.current?.contains(e.target as Node)) return
      if (btnRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={`p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors ${className}`}
        title="More actions"
      >
        <MoreHorizontal size={size} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] bg-[var(--bg-surface)] border border-slate-200 dark:border-white/[0.12] rounded-lg shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] py-1 min-w-[160px]"
            style={
              pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }
            }
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  item.onClick(btnRef.current!.getBoundingClientRect())
                }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                  item.danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                }`}
              >
                <item.icon size={16} className="shrink-0" />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
