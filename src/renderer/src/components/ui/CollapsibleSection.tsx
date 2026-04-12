import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type Accent = 'blue' | 'red' | 'slate'

const accentStyles: Record<Accent, { label: string; count: string; chevron: string }> = {
  red: {
    label: 'text-red-500 dark:text-[#e8a045]',
    count: 'text-red-500 dark:text-[#e8a045] bg-red-50 dark:bg-[#e8a045]/[0.08]',
    chevron: 'text-[#e8a045]/60',
  },
  blue: {
    label: 'text-blue-500 dark:text-[#6498c8]',
    count: 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]',
    chevron: 'text-[#6498c8]/60',
  },
  slate: {
    label: 'text-slate-500 dark:text-white/60',
    count: 'text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/[0.06]',
    chevron: 'text-slate-400 dark:text-white/55',
  },
}

export function CollapsibleSection({
  label,
  count,
  accent = 'blue',
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  indent = false,
  children,
  headerExtra,
  onHeaderDragOver,
  onHeaderDragLeave,
  onHeaderDrop,
  isHeaderDropTarget,
}: {
  label: string
  count: number
  accent?: Accent
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  indent?: boolean
  children: ReactNode
  headerExtra?: ReactNode
  onHeaderDragOver?: (e: React.DragEvent) => void
  onHeaderDragLeave?: (e: React.DragEvent) => void
  onHeaderDrop?: (e: React.DragEvent) => void
  isHeaderDropTarget?: boolean
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : localOpen

  function handleToggle() {
    if (isControlled) onOpenChange?.(!open)
    else setLocalOpen((o) => !o)
  }

  const s = accentStyles[accent]

  return (
    <div>
      <div
        onDragOver={onHeaderDragOver}
        onDragLeave={onHeaderDragLeave}
        onDrop={onHeaderDrop}
        className={`flex items-center gap-1 transition-colors ${indent ? 'px-3 py-1.5' : 'px-4 py-2'} ${isHeaderDropTarget ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30 rounded' : ''}`}
      >
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 flex-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-lg ${indent ? 'px-1 py-0.5' : 'px-1 py-1'}`}
        >
          <span
            className={`text-[13px] font-bold uppercase tracking-wide flex-1 ${s.label}`}
          >
            {label}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-transparent border-b-[1.5px] ${s.count}`}>
            {count}
          </span>
          {open ? (
            <ChevronUp size={20} className={s.chevron} />
          ) : (
            <ChevronDown size={20} className={s.chevron} />
          )}
        </button>
        {headerExtra}
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}
