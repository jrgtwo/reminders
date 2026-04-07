import { useMemo, useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getWeekDays, isSameDay, parseDateStr } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { useRemindersStore } from '../../store/reminders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import type { Reminder } from '../../types/models'
import ReminderForm from '../reminders/ReminderForm'
import ReminderDetail from '../reminders/ReminderDetail'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_H = 64
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
  const lists = useTodoListsStore((s) => s.lists)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  const scrollRef = useRef<HTMLDivElement>(null)
  const saveReminder = useRemindersStore((s) => s.save)
  const [newForm, setNewForm] = useState<{ date: string; time: string } | null>(null)
  const [detail, setDetail] = useState<{ reminder: Reminder; dateStr: string } | null>(null)

  const days = useMemo(() => getWeekDays(displayDate), [displayDate])

  const listCountByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const l of lists) {
      if (!l.dueDate) continue
      map[l.dueDate] = (map[l.dueDate] ?? 0) + 1
    }
    return map
  }, [lists])

  const { timedByDate, allDayByDate, multiDayReminders } = useMemo(() => {
    const timed: Record<string, Reminder[]> = {}
    const allDay: Record<string, Reminder[]> = {}
    const multiDay: Reminder[] = []
    const weekStart = days[0].toString()
    const weekEnd = days[6].toString()

    for (const reminder of reminders) {
      if (reminder.endDate && reminder.endDate > reminder.date) {
        if (reminder.date <= weekEnd && reminder.endDate >= weekStart) {
          multiDay.push(reminder)
        }
        continue
      }
      for (const dateStr of getOccurrencesInRange(reminder, days[0], days[6])) {
        if (reminder.startTime) {
          if (!timed[dateStr]) timed[dateStr] = []
          timed[dateStr].push(reminder)
        } else {
          if (!allDay[dateStr]) allDay[dateStr] = []
          allDay[dateStr].push(reminder)
        }
      }
    }
    return { timedByDate: timed, allDayByDate: allDay, multiDayReminders: multiDay }
  }, [reminders, days])

  const selectedPlainDate = useMemo(() => parseDateStr(selectedDate), [selectedDate])

  const now = Temporal.Now.plainDateTimeISO()
  const todayStr = now.toPlainDate().toString()
  const nowMinutes = now.hour * 60 + now.minute
  const nowTop = (nowMinutes / 60) * SLOT_H

  const hasSingleDayAllDay = days.some(
    (d) => (allDayByDate[d.toString()] ?? []).length > 0 || (listCountByDate[d.toString()] ?? 0) > 0
  )
  const hasAllDay = multiDayReminders.length > 0 || hasSingleDayAllDay

  function getColSpan(r: Reminder) {
    const weekStart = days[0].toString()
    const weekEnd = days[6].toString()
    const clampedStart = r.date < weekStart ? weekStart : r.date
    const clampedEnd = r.endDate! > weekEnd ? weekEnd : r.endDate!
    const startCol = days.findIndex((d) => d.toString() === clampedStart)
    const endCol = days.findIndex((d) => d.toString() === clampedEnd)
    return { startCol: startCol === -1 ? 0 : startCol, endCol: endCol === -1 ? 6 : endCol }
  }

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--bg-app)]">

        {/* Day header row */}
        <div
          className="sticky top-0 z-20 grid border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
        >
          <div />
          {days.map((day) => {
            const isToday = day.toString() === todayStr
            const isSelected = isSameDay(day, selectedPlainDate)
            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={[
                  'relative flex flex-col items-center py-2 gap-0.5 overflow-hidden transition-colors',
                  isToday
                    ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07] hover:bg-blue-100/60 dark:hover:bg-[#6498c8]/[0.12]'
                    : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[5px] bg-blue-500 dark:bg-[#6498c8]" />}
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 dark:text-white/18">
                  {DAY_NAMES[day.dayOfWeek % 7]}
                </span>
                <span className={[
                  'flex items-center justify-center w-8 h-8 text-[15px] font-bold leading-none',
                  isToday ? 'text-blue-500 dark:text-[#6498c8]'
                    : isSelected ? 'text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-white/80',
                ].filter(Boolean).join(' ')}>
                  {day.day}
                </span>
              </button>
            )
          })}
        </div>

        {/* All-day strip */}
        {hasAllDay && (
          <div className="sticky top-[65px] z-10 border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]">
            {/* Multi-day spanning reminders */}
            {multiDayReminders.length > 0 && (
              <div className="flex py-[3px]">
                <div style={{ width: '3.5rem', flexShrink: 0 }} />
                <div className="flex-1 relative" style={{ height: '22px' }}>
                  {multiDayReminders.map((r) => {
                    const { startCol, endCol } = getColSpan(r)
                    return (
                      <button
                        key={r.id}
                        onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr: r.date }) }}
                        className="absolute top-0 h-full px-1.5 rounded text-[10px] font-semibold truncate bg-[#6498c8]/[0.18] text-[#6498c8] transition-all duration-150 hover:bg-[#6498c8]/[0.32] hover:brightness-125 hover:shadow-md"
                        style={{
                          left: `calc(${startCol} * 100% / 7)`,
                          width: `calc(${endCol - startCol + 1} * 100% / 7 - 4px)`,
                        }}
                      >
                        {r.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Single-day all-day reminders */}
            {hasSingleDayAllDay && (
              <div
                className="grid"
                style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
              >
                <div className="flex items-center justify-end pr-2 py-1">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-300 dark:text-white/20">all‑day</span>
                </div>
                {days.map((day) => {
                  const dateStr = day.toString()
                  const dayReminders = allDayByDate[dateStr] ?? []
                  const dayListCount = listCountByDate[dateStr] ?? 0
                  const isOverdue = dateStr < todayStr
                  const listBadge = isOverdue
                    ? 'bg-[#e8a045]/[0.12] text-[#e8a045] hover:bg-[#e8a045]/[0.28]'
                    : 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/[0.28]'
                  return (
                    <div key={dateStr} className={['flex flex-col gap-[2px] px-1 py-1 min-h-[28px] overflow-hidden min-w-0', dateStr === todayStr ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07]' : ''].join(' ')}>
                      {dayReminders.slice(0, 3).map((r) => (
                        <button
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr }) }}
                          className="w-full text-left px-1.5 py-[2px] rounded text-[10px] font-semibold truncate bg-[#6498c8]/[0.12] text-[#6498c8] transition-all duration-150 hover:bg-[#6498c8]/[0.28] hover:brightness-125 hover:shadow-md hover:scale-[1.03]"
                        >
                          {r.title}
                        </button>
                      ))}
                      {dayListCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/day/${dateStr}`, { state: { tab: 'todos' } }) }}
                          className={`w-full text-left px-1.5 py-[2px] rounded text-[10px] font-semibold truncate transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${listBadge}`}
                        >
                          ☐ {dayListCount} {dayListCount === 1 ? 'list' : 'lists'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Time grid */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)', minHeight: `${SLOT_H * 24}px` }}
        >
          {days.some((d) => d.toString() === todayStr) && (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${nowTop}px` }}>
              <div className="absolute left-14 right-0 flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-blue-500" />
              </div>
            </div>
          )}

          {HOURS.map((hour) => (
            <>
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
              {days.map((day) => {
                const dateStr = day.toString()
                const isToday = dateStr === todayStr
                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={[
                      'border-t border-l border-slate-200/50 dark:border-white/[0.04] min-w-0 cursor-pointer',
                      'opacity-80 hover:opacity-100 hover:brightness-105 transition-all duration-150',
                      isToday ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07]' : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]',
                    ].filter(Boolean).join(' ')}
                    style={{ height: `${SLOT_H}px` }}
                    onClick={() => setNewForm({ date: dateStr, time: `${String(hour).padStart(2, '0')}:00` })}
                  />
                )
              })}
            </>
          ))}

          {/* Timed reminder overlays — one absolute column per day */}
          {days.map((day, dayIndex) => {
            const dateStr = day.toString()
            const dayReminders = timedByDate[dateStr] ?? []
            if (dayReminders.length === 0) return null
            return (
              <div
                key={`overlay-${dateStr}`}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: `calc(3.5rem + ${dayIndex} * (100% - 3.5rem) / 7)`,
                  width: `calc((100% - 3.5rem) / 7)`,
                  height: `${SLOT_H * 24}px`,
                }}
              >
                {dayReminders.map((r) => {
                  const [sh, sm] = r.startTime!.split(':').map(Number)
                  const top = (sh + sm / 60) * SLOT_H
                  let height: number
                  if (r.endTime) {
                    const [eh, em] = r.endTime.split(':').map(Number)
                    height = Math.max(20, ((eh + em / 60) - (sh + sm / 60)) * SLOT_H)
                  } else {
                    height = SLOT_H - 8
                  }
                  return (
                    <button
                      key={r.id}
                      onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr }) }}
                      className="absolute left-1 right-1 px-1.5 py-[3px] rounded-md text-[11px] font-semibold bg-[#6498c8]/[0.15] text-[#6498c8] transition-all duration-150 hover:bg-[#6498c8]/[0.28] hover:brightness-125 hover:shadow-md pointer-events-auto overflow-hidden"
                      style={{ top, height }}
                    >
                      <span className="block truncate">{r.startTime}{r.endTime ? `–${r.endTime}` : ''} {r.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {newForm && (
        <ReminderForm
          date={newForm.date}
          reminder={null}
          defaultTime={newForm.time}
          onSave={async (r) => { await saveReminder(r); setNewForm(null) }}
          onClose={() => setNewForm(null)}
        />
      )}

      {detail && (
        <ReminderDetail
          reminder={detail.reminder}
          dateStr={detail.dateStr}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
