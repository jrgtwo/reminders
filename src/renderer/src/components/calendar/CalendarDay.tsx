import { Temporal } from '@js-temporal/polyfill'
import { FileText } from 'lucide-react'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder } from '../../types/models'

const DOT_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500']

interface Props {
  date: Temporal.PlainDate
  displayMonth: Temporal.PlainDate
  reminders: Reminder[]
  hasNote?: boolean
  isSelected: boolean
  onClick: () => void
  tall?: boolean
}

export default function CalendarDay({
  date,
  displayMonth,
  reminders,
  hasNote,
  isSelected,
  onClick,
  tall,
}: Props) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)
  const visibleDots = reminders.slice(0, 3)
  const extra = reminders.length - 3

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-center pt-1 pb-2 gap-1 w-full rounded-lg transition-colors cursor-pointer',
        tall ? 'min-h-[120px]' : 'min-h-[60px]',
        inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600',
        isSelected && !todayDate ? 'bg-blue-50 dark:bg-blue-900/30' : '',
        !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
          todayDate ? 'bg-blue-600 text-white' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatDayNum(date)}
      </span>

      {(reminders.length > 0 || hasNote) && (
        <div className="flex items-center gap-0.5 flex-wrap justify-center">
          {visibleDots.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`}
            />
          ))}
          {extra > 0 && (
            <span className="text-[10px] text-gray-400 leading-none">+{extra}</span>
          )}
          {hasNote && (
            <FileText
              size={9}
              className="text-gray-400 dark:text-gray-500 shrink-0"
            />
          )}
        </div>
      )}
    </button>
  )
}
