import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { formatMonthYear, formatWeekRange } from '../../utils/dates'

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
  const title = view === 'week' ? formatWeekRange(weekDays) : formatMonthYear(displayDate)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.07] shrink-0 bg-white dark:bg-white/[0.03] dark:backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="Previous"
          className="p-1.5 rounded-lg text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          aria-label="Next"
          className="p-1.5 rounded-lg text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <h2 className="text-2xl font-bold ml-2 min-w-[220px] text-gray-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.07] hover:bg-gray-100 dark:hover:bg-white/[0.12] text-gray-700 dark:text-white/80 transition-all"
        >
          Today
        </button>
        <div className="flex rounded-lg border border-gray-200 dark:border-white/[0.12] overflow-hidden">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={[
                'px-3 py-1.5 text-sm transition-all capitalize',
                view === v
                  ? 'bg-blue-600 dark:bg-white/20 text-white dark:text-white'
                  : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.08]',
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
