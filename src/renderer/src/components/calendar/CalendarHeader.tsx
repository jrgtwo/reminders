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
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label="Previous"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          aria-label="Next"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold ml-2 min-w-[220px]">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={[
                'px-3 py-1.5 text-sm transition-colors capitalize',
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100',
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
