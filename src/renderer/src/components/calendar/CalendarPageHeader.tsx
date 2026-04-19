import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  view: 'month' | 'week' | 'day'
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: 'month' | 'week') => void
  prevLabel?: string
  nextLabel?: string
  children: React.ReactNode
}

const NAV_BTN = 'w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all'
const ACTION_BTN_BASE = 'px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25'
const ACTION_BTN_INACTIVE = 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60'
const ACTION_BTN_ACTIVE = 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.12] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.2] shadow-sm'

export default function CalendarPageHeader({
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  children,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 sm:py-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0 bg-[var(--bg-surface)] gap-1.5 sm:gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button onClick={onPrev} aria-label={prevLabel} className={NAV_BTN}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={onNext} aria-label={nextLabel} className={NAV_BTN}>
            <ChevronRight size={20} />
          </button>
        </div>
        {children}
      </div>

      <div className="flex items-center gap-2 pt-1 sm:pt-0">
        <button onClick={onToday} className={`${ACTION_BTN_BASE} ${ACTION_BTN_INACTIVE}`}>
          Today
        </button>
        <div className="flex gap-1">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`${ACTION_BTN_BASE} ${view === v ? ACTION_BTN_ACTIVE : ACTION_BTN_INACTIVE}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
