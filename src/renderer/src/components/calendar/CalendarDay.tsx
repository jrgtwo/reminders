import { Temporal } from '@js-temporal/polyfill'
import { Bell, Clock, Repeat, FileText, CheckSquare } from 'lucide-react'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder, Todo } from '../../types/models'

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
  todos?: Todo[]
  hasNote?: boolean
  isSelected: boolean
  isWeekend?: boolean
  onClick: () => void
  onReminderClick?: () => void
  onNoteClick?: () => void
  onTodoClick?: () => void
  tall?: boolean
}

export default function CalendarDay({
  date,
  displayMonth,
  reminders,
  todos = [],
  hasNote,
  isSelected,
  isWeekend,
  onClick,
  onReminderClick,
  onNoteClick,
  onTodoClick,
  tall,
}: Props) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)
  const colors = getEventColor(date)

  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  const todoChip = cmp < 0
    ? 'bg-[#e8a045]/[0.12] text-[#e8a045] dark:bg-[#e8a045]/[0.10] dark:text-[#e8a045]'
    : 'bg-emerald-500/[0.12] text-emerald-600 dark:bg-emerald-500/[0.08] dark:text-emerald-400'

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
        'relative flex flex-col items-start w-full text-left cursor-pointer rounded-lg overflow-hidden',
        'transition-all duration-200',
        'z-0 hover:z-10 opacity-80 hover:opacity-100 hover:brightness-110',
        '[transform-origin:top_center] hover:[transform:perspective(600px)_rotateX(2deg)]',
        tall ? 'p-3.5 gap-2' : 'p-1.5 gap-1 md:p-2 md:gap-1.5 lg:p-2.5 lg:gap-2',
        bg,
        isSelected
          ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.5),0_4px_20px_rgba(59,130,246,0.14)] dark:shadow-[0_0_0_2px_rgba(96,165,250,0.45),0_4px_20px_rgba(59,130,246,0.18)]'
          : 'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.09),0_1px_3px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.25)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Date number */}
      <span
        className={[
          'flex items-center justify-center rounded-full shrink-0 font-normal leading-none',
          tall ? 'w-8 h-8 text-[15px]' : 'w-7 h-7 text-[14px]',
          todayDate
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
            : inMonth
            ? 'text-slate-700 dark:text-white/80'
            : 'text-slate-300 dark:text-white/20',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 400 }}
      >
        {formatDayNum(date)}
      </span>

      {/* Events + Note */}
      {(reminders.length > 0 || todos.length > 0 || hasNote) && (
        <div className={`flex flex-col w-full ${tall ? 'gap-1' : 'gap-[3px]'}`}>
          {tall ? (
            <>
              {reminders.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className={`w-full px-2 py-[4px] rounded-md text-[11px] font-semibold leading-tight truncate transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${colors.chip}`}
                >
                  {r.title}
                </div>
              ))}
              {todos.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}
                  className={`w-full px-2 py-[4px] rounded-md text-[11px] font-semibold leading-tight truncate transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] cursor-pointer ${todoChip}`}
                >
                  {t.title}
                </div>
              ))}
              {(reminders.length + todos.length) > 6 && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/25 px-1">
                  +{reminders.length + todos.length - 6} more
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-row flex-wrap lg:flex-col w-full gap-1 lg:gap-[3px]">
              {reminders.slice(0, 4).map((r) => {
                const icon = r.time
                  ? <Clock size={13} />
                  : r.recurrence
                  ? <Repeat size={13} />
                  : <Bell size={13} />
                return (
                  <span key={r.id} className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}>
                    <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${colors.chip}`}>
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
              {todos.slice(0, 2).map((t) => (
                <span key={t.id} className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}>
                  <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${todoChip}`}>
                    <CheckSquare size={11} className="shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </span>
                  <span className={`hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded ${todoChip}`}>
                    <CheckSquare size={12} />
                  </span>
                  <span className={`flex md:hidden ${cmp < 0 ? 'text-[#e8a045]/70' : 'text-emerald-500/70'}`}>
                    <CheckSquare size={13} />
                  </span>
                </span>
              ))}
              {hasNote && (
                <span className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onNoteClick?.() }}>
                  <span className="hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35">
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
              {(reminders.length + todos.length) > 6 && (
                <span className="text-[9px] text-slate-400 dark:text-white/25 leading-none lg:px-1">
                  +{reminders.length + todos.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  )
}
