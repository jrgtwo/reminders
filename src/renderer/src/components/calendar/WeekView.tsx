import { useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getWeekDays, isSameDay, parseDateStr } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { useRemindersStore } from '../../store/reminders.store'
import { useUIStore } from '../../store/ui.store'
import type { Reminder } from '../../types/models'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_H = 64 // px per hour slot
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function parseHour(time: string): number {
  return Math.min(23, Math.max(0, parseInt(time.split(':')[0], 10)))
}

interface Props {
  displayDate: Temporal.PlainDate
}

export default function WeekView({ displayDate }: Props) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  const scrollRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => getWeekDays(displayDate), [displayDate])

  const { timedByDate, allDayByDate } = useMemo(() => {
    const timed: Record<string, Reminder[]> = {}
    const allDay: Record<string, Reminder[]> = {}
    for (const reminder of reminders) {
      for (const dateStr of getOccurrencesInRange(reminder, days[0], days[6])) {
        if (reminder.time) {
          if (!timed[dateStr]) timed[dateStr] = []
          timed[dateStr].push(reminder)
        } else {
          if (!allDay[dateStr]) allDay[dateStr] = []
          allDay[dateStr].push(reminder)
        }
      }
    }
    return { timedByDate: timed, allDayByDate: allDay }
  }, [reminders, days])

  const selectedPlainDate = useMemo(() => parseDateStr(selectedDate), [selectedDate])

  const now = Temporal.Now.plainDateTimeISO()
  const todayStr = now.toPlainDate().toString()
  const nowMinutes = now.hour * 60 + now.minute
  const nowTop = (nowMinutes / 60) * SLOT_H

  const hasAllDay = days.some((d) => (allDayByDate[d.toString()] ?? []).length > 0)

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const target = Math.max(0, (now.hour - 2) * SLOT_H)
      scrollRef.current.scrollTop = target
    }
  }, [])

  function handleDayClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day header row */}
      <div
        className="grid border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)] shrink-0"
        style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
      >
        {/* Time gutter label */}
        <div />
        {days.map((day) => {
          const isToday = day.toString() === todayStr
          const isSelected = isSameDay(day, selectedPlainDate)
          return (
            <button
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center py-2 gap-0.5 hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 dark:text-white/18">
                {DAY_NAMES[day.dayOfWeek % 7]}
              </span>
              <span
                className={[
                  'flex items-center justify-center w-8 h-8 rounded-full text-[15px] font-bold leading-none',
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : isToday
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-700 dark:text-white/80',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {day.day}
              </span>
            </button>
          )
        })}
      </div>

      {/* All-day strip */}
      {hasAllDay && (
        <div
          className="grid border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)] shrink-0"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
        >
          <div className="flex items-center justify-end pr-2 py-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-slate-300 dark:text-white/20">
              all‑day
            </span>
          </div>
          {days.map((day) => {
            const dateStr = day.toString()
            const dayReminders = allDayByDate[dateStr] ?? []
            return (
              <div key={dateStr} className="flex flex-col gap-[2px] px-1 py-1 min-h-[28px]">
                {dayReminders.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="w-full px-1.5 py-[2px] rounded text-[10px] font-semibold truncate bg-indigo-50 text-indigo-700 dark:bg-indigo-500/[0.12] dark:text-indigo-300"
                  >
                    {r.title}
                  </div>
                ))}
                {dayReminders.length > 3 && (
                  <span className="text-[9px] text-slate-400 dark:text-white/25 pl-1">
                    +{dayReminders.length - 3}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--bg-app)]">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: '3.5rem repeat(7, 1fr)',
            minHeight: `${SLOT_H * 24}px`,
          }}
        >
          {/* Current time line — spans all 7 columns */}
          {days.some((d) => d.toString() === todayStr) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div
                className="absolute left-14 right-0 flex items-center"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-blue-500" />
              </div>
            </div>
          )}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <>
              {/* Time label */}
              <div
                key={`label-${hour}`}
                className="flex items-start justify-end pr-2 pt-1"
                style={{ height: `${SLOT_H}px` }}
              >
                {hour !== 0 && (
                  <span className="text-[10px] font-medium text-slate-300 dark:text-white/20 -translate-y-[0.45em]">
                    {formatHour(hour)}
                  </span>
                )}
              </div>

              {/* Day cells for this hour */}
              {days.map((day) => {
                const dateStr = day.toString()
                const isToday = dateStr === todayStr
                const cellReminders = (timedByDate[dateStr] ?? []).filter(
                  (r) => r.time && parseHour(r.time) === hour,
                )
                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={[
                      'relative border-t border-l border-slate-200/50 dark:border-white/[0.04]',
                      isToday ? 'bg-blue-50/30 dark:bg-blue-500/[0.03]' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ height: `${SLOT_H}px` }}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex flex-col gap-[2px] p-1 overflow-hidden h-full">
                      {cellReminders.map((r) => (
                        <div
                          key={r.id}
                          className="w-full px-1.5 py-[3px] rounded-md text-[11px] font-semibold truncate bg-indigo-100 text-indigo-700 dark:bg-indigo-500/[0.15] dark:text-indigo-300 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.time} {r.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
