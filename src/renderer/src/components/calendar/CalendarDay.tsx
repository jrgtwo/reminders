import { memo } from 'react'
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

function CalendarDay({
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
  const { todayDate, inMonth, colors, listBadgeCls, bg, tileRef } = useCalendarDay({ date, displayMonth, isSelected })

  return (
    <button
      ref={tileRef}
      onClick={onClick}
      className={[
        'relative flex flex-col items-start w-full text-left cursor-pointer rounded-[2px] overflow-hidden',
        'transition-[opacity,filter,border] duration-200',
        'border-[0.5px] border-slate-300/60 dark:border-white/[0.12]',
        'border-b-[0.5px] border-b-slate-300/60 dark:border-b-white/[0.12]',
        isSelected
          ? 'z-[10] opacity-100 brightness-110 outline outline-1 outline-slate-300/60 dark:outline-white/[0.1]'
          : 'z-[2] opacity-80 hover:z-[10] hover:opacity-100 hover:brightness-110',
        tall ? 'p-3.5 gap-2' : 'p-1.5 gap-1 md:p-2 md:gap-1.5 lg:p-2.5 lg:gap-2',
        bg,
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
        <div className="cal-badges-row flex flex-row flex-wrap md:flex-col gap-[3px] w-full">
          {/* Reminders */}
          {reminders.length > 1 ? (
            <span
              className={`flex items-center gap-1 px-1.5 py-[3px] rounded text-[10px] font-medium cursor-pointer md:w-full ${colors.chip}`}
              onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}
            >
              <Bell size={12} className="shrink-0" />
              <span className="hidden md:inline">{reminders.length} reminders</span>
              <span className="md:hidden">{reminders.length}</span>
            </span>
          ) : reminders.length === 1 ? (() => {
            const r = reminders[0]
            const icon12 = r.startTime ? <Clock size={12} /> : r.recurrence ? <Repeat size={12} /> : <Bell size={12} />
            return (
              <span
                key={r.id}
                className={`flex items-center gap-1 px-1.5 py-[3px] rounded text-[10px] font-medium cursor-pointer md:w-full ${colors.chip}`}
                onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}
              >
                <span className="shrink-0">{icon12}</span>
                <span className="hidden md:inline truncate">{r.title}</span>
              </span>
            )
          })() : null}

          {/* Lists */}
          {listCount > 0 && (
            <span
              className={`flex items-center gap-1 px-1.5 py-[3px] rounded text-[10px] font-medium cursor-pointer md:w-full ${listBadgeCls}`}
              onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}
            >
              <CheckSquare size={12} className="shrink-0" />
              <span className="hidden md:inline">{listCount} {listCount === 1 ? 'list' : 'lists'}</span>
              {listCount > 1 && <span className="md:hidden">{listCount}</span>}
            </span>
          )}

          {/* Notes */}
          {noteCount > 0 && (
            <span
              className="flex items-center gap-1 px-1.5 py-[3px] rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/55 cursor-pointer md:w-full"
              onClick={(e) => { e.stopPropagation(); onNoteClick?.() }}
            >
              <FileText size={12} className="shrink-0" />
              <span className="hidden md:inline">{noteCount > 1 ? `${noteCount} notes` : 'note'}</span>
              {noteCount > 1 && <span className="md:hidden">{noteCount}</span>}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

export default memo(CalendarDay)
