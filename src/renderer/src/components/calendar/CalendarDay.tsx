import { Temporal } from '@js-temporal/polyfill'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder } from '../../types/models'

const FUTURE_STYLES = [
  'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-400/20 dark:border-blue-400/30 dark:text-blue-200',
  'bg-green-50 border border-green-200 text-green-700 dark:bg-green-400/20 dark:border-green-400/30 dark:text-green-200',
  'bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-400/20 dark:border-purple-400/30 dark:text-purple-200',
  'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-400/20 dark:border-orange-400/30 dark:text-orange-200',
]

function getReminderStyle(date: Temporal.PlainDate, index: number): string {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp < 0) return 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300'
  if (cmp === 0) return 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-400/20 dark:border-amber-400/30 dark:text-amber-200'
  return FUTURE_STYLES[index % FUTURE_STYLES.length]
}

interface Props {
  date: Temporal.PlainDate
  displayMonth: Temporal.PlainDate
  reminders: Reminder[]
  hasNote?: boolean
  isSelected: boolean
  isWeekend?: boolean
  onClick: () => void
  tall?: boolean
}

export default function CalendarDay({
  date,
  displayMonth,
  reminders,
  hasNote,
  isSelected,
  isWeekend,
  onClick,
  tall,
}: Props) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-start p-2 gap-1 w-full transition-all cursor-pointer',
        tall ? 'min-h-[120px]' : 'min-h-[60px]',
        inMonth
          ? isWeekend
            ? 'bg-gray-50/60 dark:bg-white/[0.02]'
            : 'bg-white dark:bg-[#080c14]/60'
          : 'bg-gray-50 dark:bg-black/30',
        inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-white/25',
        isSelected
          ? 'ring-1 ring-inset ring-blue-500 dark:ring-white/25 bg-blue-50/50 dark:bg-white/[0.1]'
          : 'hover:bg-gray-100 dark:hover:bg-white/[0.06]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
          todayDate
            ? 'bg-blue-600 dark:bg-white/25 text-white dark:ring-1 dark:ring-white/40'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatDayNum(date)}
      </span>

      {(reminders.length > 0 || hasNote) && (
        <div className="flex flex-col gap-0.5 w-full">
          {reminders.slice(0, 3).map((r, i) => (
            <span
              key={r.id}
              className={`text-[10px] leading-tight truncate w-full px-1 py-0.5 rounded ${getReminderStyle(date, i)}`}
            >
              {r.title}
            </span>
          ))}
          {reminders.length > 3 && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-white/40 leading-none px-1 py-0.5 bg-gray-100 dark:bg-white/[0.06] rounded">
              +{reminders.length - 3} more
            </span>
          )}
          {hasNote && (
            <span className="flex items-center gap-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            </span>
          )}
        </div>
      )}
    </button>
  )
}
