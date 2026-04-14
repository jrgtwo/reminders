import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { formatWeekRange } from '../../utils/dates'

interface Props {
  displayDate: Temporal.PlainDate
  view: 'month' | 'week'
  weekDays: Temporal.PlainDate[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: 'month' | 'week') => void
}

export default function CalendarHeader({
  displayDate,
  view,
  weekDays,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: Props) {
  const isMonth = view === 'month'
  const monthName = isMonth
    ? displayDate.toLocaleString('en-US', { month: 'long' })
    : formatWeekRange(weekDays)
  const yearStr = isMonth ? String(displayDate.year) : ''

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0 bg-[var(--bg-surface)] gap-2 paper">
      <div className="flex items-end gap-3">
        <div className="flex items-baseline gap-2.5 leading-none">
          <h2
            className={[
              'tracking-tight text-slate-900 dark:text-white/80',
              isMonth ? 'text-4xl' : 'text-2xl',
            ].join(' ')}
            style={{ fontFamily: "'Bree Serif', serif" }}
          >
            {monthName}
          </h2>
          {yearStr && (
            <span className="text-xl font-normal text-slate-300 dark:text-white/50 tracking-tight" style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif", fontWeight: 400 }}>
              {yearStr}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 mb-1">
          <button
            onClick={onPrev}
            aria-label="Previous"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNext}
            aria-label="Next"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 sm:pt-0">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60"
        >
          Today
        </button>
        <div className="flex gap-1">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={[
                'px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25',
                view === v
                  ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.12] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.2] shadow-sm'
                  : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60',
              ].join(' ')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
