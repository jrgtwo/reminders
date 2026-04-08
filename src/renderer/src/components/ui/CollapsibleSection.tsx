import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function CollapsibleSection({
  label,
  count,
  accent = 'blue',
  defaultOpen = true,
  children,
  headerExtra
}: {
  label: string
  count: number
  accent?: 'blue' | 'red' | 'slate'
  defaultOpen?: boolean
  children: ReactNode
  headerExtra?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const labelCls =
    accent === 'red'
      ? 'text-red-500 dark:text-[#e8a045]'
      : accent === 'slate'
        ? 'text-slate-400 dark:text-white/30'
        : 'text-blue-500 dark:text-[#6498c8]'
  const countCls =
    accent === 'red'
      ? 'text-red-500 dark:text-[#e8a045] bg-red-50 dark:bg-[#e8a045]/[0.08]'
      : accent === 'slate'
        ? 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/[0.05]'
        : 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]'
  const chevronCls =
    accent === 'red'
      ? 'text-[#e8a045]/60'
      : accent === 'slate'
        ? 'text-slate-300 dark:text-white/20'
        : 'text-[#6498c8]/60'
  return (
    <div>
      <div className="flex items-center gap-1 px-4 py-1.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <span className={`text-[13px] font-bold uppercase tracking-wide flex-1 ${labelCls}`}>
            {label}
          </span>
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countCls}`}>
              {count}
            </span>
          )}
          {open ? (
            <ChevronUp size={11} className={chevronCls} />
          ) : (
            <ChevronDown size={11} className={chevronCls} />
          )}
        </button>
        {headerExtra}
      </div>
      {open && <div className="animate-in fade-in duration-200 bg-slate-50/70 dark:bg-white/[0.018] rounded-sm">{children}</div>}
    </div>
  )
}
