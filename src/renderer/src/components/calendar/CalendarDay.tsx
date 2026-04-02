import { Temporal } from '@js-temporal/polyfill'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder } from '../../types/models'

function getEventColor(date: Temporal.PlainDate): { dot: string; text: string; chip: string } {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp < 0)
    return {
      dot: 'bg-red-400',
      text: 'text-red-600 dark:text-red-400',
      chip: 'bg-red-50 text-red-700 dark:bg-red-500/[0.15] dark:text-red-300',
    }
  if (cmp === 0)
    return {
      dot: 'bg-amber-400',
      text: 'text-amber-700 dark:text-amber-400',
      chip: 'bg-amber-50 text-amber-800 dark:bg-amber-400/[0.15] dark:text-amber-300',
    }
  return {
    dot: 'bg-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/[0.12] dark:text-indigo-300',
  }
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
  const colors = getEventColor(date)

  let bg: string
  if (isSelected) {
    bg = 'bg-white dark:bg-[#1a2540]'
  } else if (todayDate) {
    bg = 'bg-blue-50 dark:bg-blue-950/60'
  } else if (!inMonth) {
    bg = 'bg-slate-50 dark:bg-[#0b0e14]'
  } else {
    bg = 'bg-white dark:bg-[#13171f]'
  }

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-start w-full text-left cursor-pointer',
        'transition-all duration-150',
        'z-0 hover:z-10',
        tall ? 'p-3.5 gap-2 min-h-[110px]' : 'p-2.5 gap-1.5 min-h-[76px]',
        bg,
        isSelected
          ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.5),0_4px_20px_rgba(59,130,246,0.14)] dark:shadow-[0_0_0_2px_rgba(96,165,250,0.45),0_4px_20px_rgba(59,130,246,0.18)]'
          : todayDate
          ? 'hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.35)]'
          : 'hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Date number */}
      <span
        className={[
          'flex items-center justify-center rounded-full shrink-0 font-bold leading-none',
          tall ? 'w-8 h-8 text-[15px]' : 'w-7 h-7 text-[14px]',
          todayDate
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
            : inMonth
            ? 'text-slate-700 dark:text-white/80'
            : 'text-slate-300 dark:text-white/20',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatDayNum(date)}
      </span>

      {/* Events */}
      {reminders.length > 0 && (
        <div className={`flex flex-col w-full ${tall ? 'gap-1' : 'gap-[3px]'}`}>
          {tall ? (
            <>
              {reminders.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className={`w-full px-2 py-[4px] rounded-md text-[11px] font-semibold leading-tight truncate ${colors.chip}`}
                >
                  {r.title}
                </div>
              ))}
              {reminders.length > 4 && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/25 px-1">
                  +{reminders.length - 4} more
                </span>
              )}
            </>
          ) : (
            <>
              {reminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 w-full overflow-hidden">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span className={`text-[11px] font-medium leading-none truncate ${colors.text}`}>
                    {r.title}
                  </span>
                </div>
              ))}
              {reminders.length > 3 && (
                <span className="text-[10px] text-slate-400 dark:text-white/25 pl-3 leading-none">
                  +{reminders.length - 3}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Note dot */}
      {hasNote && (
        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
      )}
    </button>
  )
}
