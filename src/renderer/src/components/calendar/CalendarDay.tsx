import { Temporal } from '@js-temporal/polyfill'
import { Bell, Clock, Repeat, FileText, CheckSquare } from 'lucide-react'
import { formatDayNum } from '../../utils/dates'
import type { Reminder } from '../../types/models'
import { useCalendarDay } from './hooks/useCalendarDay'

interface Props {
  date: Temporal.PlainDate
  displayMonth: Temporal.PlainDate
  reminders: Reminder[]
  listCount?: number
  noteCount?: number
  isSelected: boolean
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
  listCount = 0,
  noteCount = 0,
  isSelected,
  onClick,
  onReminderClick,
  onNoteClick,
  onTodoClick,
  tall
}: Props) {
  const { todayDate, inMonth, cmp, colors, listBadgeCls, bg, tileRef } = useCalendarDay({ date, displayMonth, isSelected })

  return (
    <button
      ref={tileRef}
      onClick={onClick}
      className={[
        'relative flex flex-col items-start w-full text-left cursor-pointer rounded-lg overflow-hidden',
        'transition-[opacity,box-shadow,filter,border,translate] duration-200',
        'border border-white/50 dark:border-white/[0.10] border-b-[3px] border-b-slate-300/60 dark:border-b-white/[0.18]',
        'hover:-translate-y-[3px] active:translate-y-[1px]',
        isSelected
          ? 'z-[10] opacity-100 brightness-110'
          : 'z-[2] opacity-80 hover:z-[10] hover:opacity-100 hover:brightness-110',
        tall ? 'p-3.5 gap-2' : 'p-1.5 gap-1 md:p-2 md:gap-1.5 lg:p-2.5 lg:gap-2',
        bg,
        isSelected
          ? 'shadow-[0_4px_0_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_0_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.2)] outline outline-1 outline-slate-300/60 dark:outline-white/[0.1] active:shadow-[0_1px_0_rgba(0,0,0,0.08)] dark:active:shadow-[0_1px_0_rgba(0,0,0,0.3)]'
          : 'shadow-[0_3px_0_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_3px_0_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_0_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] dark:hover:shadow-none dark:hover:brightness-125 dark:hover:border-white/25 active:shadow-[0_1px_0_rgba(0,0,0,0.08)] dark:active:shadow-none dark:active:brightness-100'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Today stripe */}
      {todayDate && (
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-[var(--accent)] rounded-t-lg" />
      )}

      {/* Date number */}
      <span
        className={[
          'flex items-center justify-center rounded-full shrink-0 leading-none',
          tall ? 'text-[15px]' : 'text-[14px]',
          todayDate
            ? 'text-[var(--accent)]'
            : inMonth
              ? 'text-slate-700 dark:text-white/80'
              : 'text-slate-300 dark:text-white/50'
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif", fontWeight: 400 }}
      >
        {formatDayNum(date)}
      </span>

      {/* Events + Note */}
      {(reminders.length > 0 || listCount > 0 || noteCount > 0) && (
        <div className={`flex flex-col w-full ${tall ? 'gap-1' : 'gap-0'}`}>
          <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-col w-full gap-0 md:gap-1 lg:gap-[3px]">
            {/* Reminders: single badge with count if >1, full badge if exactly 1 */}
            {reminders.length > 1 ? (
              <span
                className="min-w-0 lg:w-full"
                onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}
              >
                <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] cursor-pointer ${colors.chip}`}>
                  <Bell size={20} className="shrink-0" />
                  <span>{reminders.length} reminders</span>
                </span>
                <span className={`hidden md:flex lg:hidden items-center justify-center gap-[3px] px-1 h-[22px] rounded cursor-pointer text-[10px] font-medium ${colors.chip}`}>
                  <Bell size={20} /><span>{reminders.length}</span>
                </span>
                <span className={`flex md:hidden items-center gap-[2px] text-[10px] font-medium cursor-pointer ${colors.text}`}>
                  <Bell size={12} /><span>{reminders.length}</span>
                </span>
              </span>
            ) : reminders.length === 1 ? (() => {
              const r = reminders[0]
              const icon = r.startTime ? <Clock size={20} /> : r.recurrence ? <Repeat size={20} /> : <Bell size={20} />
              const iconSm = r.startTime ? <Clock size={12} /> : r.recurrence ? <Repeat size={12} /> : <Bell size={12} />
              return (
                <span
                  key={r.id}
                  className="min-w-0 lg:w-full"
                  onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}
                >
                  <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${colors.chip}`}>
                    <span className="shrink-0">{icon}</span>
                    <span className="truncate">{r.title}</span>
                  </span>
                  <span className={`hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded ${colors.chip}`}>
                    {icon}
                  </span>
                  <span className={`flex md:hidden ${colors.text}`}>{iconSm}</span>
                </span>
              )
            })() : null}

            {/* List count badge */}
            {listCount > 0 && (
              <span
                className="min-w-0 lg:w-full"
                onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}
              >
                <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] cursor-pointer ${listBadgeCls}`}>
                  <CheckSquare size={20} className="shrink-0" />
                  <span>{listCount} {listCount === 1 ? 'list' : 'lists'}</span>
                </span>
                <span className={`hidden md:flex lg:hidden items-center justify-center gap-[3px] px-1 h-[22px] rounded cursor-pointer text-[10px] font-medium ${listBadgeCls}`}>
                  <CheckSquare size={20} />{listCount > 1 && <span>{listCount}</span>}
                </span>
                <span className={`flex md:hidden items-center gap-[2px] text-[10px] font-medium cursor-pointer ${cmp < 0 ? 'text-[#e8a045]/70' : 'text-emerald-500/70'}`}>
                  <CheckSquare size={12} />{listCount > 1 && <span>{listCount}</span>}
                </span>
              </span>
            )}

            {/* Notes badge */}
            {noteCount > 0 && (
              <span
                className="min-w-0 lg:w-full"
                onClick={(e) => { e.stopPropagation(); onNoteClick?.() }}
              >
                <span className="hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/55">
                  <FileText size={20} className="shrink-0" />
                  {noteCount > 1 && <span>{noteCount} notes</span>}
                </span>
                <span className="hidden md:flex lg:hidden items-center justify-center gap-[3px] px-1 h-[22px] rounded bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/55 text-[10px] font-medium">
                  <FileText size={20} />{noteCount > 1 && <span>{noteCount}</span>}
                </span>
                <span className="flex md:hidden items-center gap-[2px] text-[10px] font-medium text-slate-300 dark:text-white/50">
                  <FileText size={12} />{noteCount > 1 && <span>{noteCount}</span>}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  )
}
