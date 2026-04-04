import { Temporal } from '@js-temporal/polyfill'
import { Bell, Clock, Repeat, FileText } from 'lucide-react'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder } from '../../types/models'

function getEventColor(date: Temporal.PlainDate): { dot: string; text: string; chip: string } {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp < 0)
    return {
      dot: 'bg-[#e8a045]',
      text: 'text-red-600 dark:text-[#e8a045]',
      chip: 'bg-red-50 text-red-700 dark:bg-[#e8a045]/[0.08] dark:text-[#e8a045]',
    }
  if (cmp === 0)
    return {
      dot: 'bg-[#e8a045]',
      text: 'text-amber-700 dark:text-[#e8a045]',
      chip: 'bg-amber-50 text-amber-800 dark:bg-[#e8a045]/[0.07] dark:text-[#e8a045]',
    }
  return {
    dot: 'bg-[#6498c8]',
    text: 'text-indigo-600 dark:text-[#6498c8]',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-[#6498c8]/[0.08] dark:text-[#6498c8]',
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
  onReminderClick?: () => void
  onNoteClick?: () => void
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
  onReminderClick,
  onNoteClick,
  tall,
}: Props) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)
  const colors = getEventColor(date)

  let bg: string
  if (isSelected) {
    bg = 'bg-[var(--bg-surface-selected)]'
  } else if (todayDate) {
    bg = 'bg-blue-50 dark:bg-[var(--bg-surface)]'
  } else if (!inMonth) {
    bg = 'bg-[var(--bg-surface-muted)]'
  } else {
    bg = 'bg-[var(--bg-surface)]'
  }

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-start w-full text-left cursor-pointer rounded-xl overflow-hidden',
        'transition-all duration-150',
        'z-0 hover:z-10',
        tall ? 'p-3.5 gap-2' : 'p-1.5 gap-1 md:p-2 md:gap-1.5 lg:p-2.5 lg:gap-2',
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

      {/* Events + Note */}
      {(reminders.length > 0 || hasNote) && (
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
            <div className="flex flex-row flex-wrap lg:flex-col w-full gap-1 lg:gap-[3px]">
              {reminders.slice(0, 5).map((r) => {
                const icon = r.time
                  ? <Clock size={13} />
                  : r.recurrence
                  ? <Repeat size={13} />
                  : <Bell size={13} />
                return (
                  <span key={r.id} className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}>
                    <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden ${colors.chip}`}>
                      <span className="shrink-0">{icon}</span>
                      <span className="truncate">{r.title}</span>
                    </span>
                    <span className={`hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded ${colors.chip}`}>
                      {icon}
                    </span>
                    <span className={`flex md:hidden ${colors.text}`}>
                      {icon}
                    </span>
                  </span>
                )
              })}
              {hasNote && (
                <span className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onNoteClick?.() }}>
                  <span className="hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35">
                    <FileText size={13} />
                  </span>
                  <span className="hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35">
                    <FileText size={13} />
                  </span>
                  <span className="flex md:hidden text-slate-300 dark:text-white/20">
                    <FileText size={13} />
                  </span>
                </span>
              )}
              {reminders.length > 5 && (
                <span className="text-[9px] text-slate-400 dark:text-white/25 leading-none lg:px-1">
                  +{reminders.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  )
}
