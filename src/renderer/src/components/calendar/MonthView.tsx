import { useRef, useCallback, useMemo, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import { Temporal } from '@js-temporal/polyfill'
import CalendarDay from './CalendarDay'
import { useMonthView } from './hooks/useMonthView'
import { getMonthGrid, addMonths, subMonths } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { useRemindersStore } from '../../store/reminders.store'
import type { Reminder } from '../../types/models'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SWIPE_THRESHOLD = 50
const SETTLE_MS = 200

interface Props {
  displayDate: Temporal.PlainDate
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

interface AdjacentProps {
  date: Temporal.PlainDate
  reminders: Reminder[]
  noteCountByDate: Record<string, number>
  listCountByDate: Record<string, number>
}

function AdjacentMonthGrid({ date, reminders, noteCountByDate, listCountByDate }: AdjacentProps) {
  const days = useMemo(() => getMonthGrid(date), [date])

  const remindersByDate = useMemo(() => {
    const gridStart = days[0]
    const gridEnd = days[days.length - 1]
    const map: Record<string, Reminder[]> = {}
    for (const reminder of reminders) {
      for (const dateStr of getOccurrencesInRange(reminder, gridStart, gridEnd)) {
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(reminder)
      }
    }
    return map
  }, [reminders, days])

  return (
    <div className="grid grid-cols-7 auto-rows-[80px] md:auto-rows-[110px] lg:auto-rows-[160px] gap-0 md:gap-1 bg-[var(--bg-app)] p-0 md:p-1.5 shrink-0 w-[calc(100%/3)]">
      {days.map((day) => {
        const key = day.toString()
        return (
          <CalendarDay
            key={key}
            date={day}
            displayMonth={date}
            reminders={remindersByDate[key] ?? []}
            noteCount={noteCountByDate[key] ?? 0}
            listCount={listCountByDate[key] ?? 0}
            isSelected={false}
            onClick={() => {}}
          />
        )
      })}
    </div>
  )
}

export default function MonthView({ displayDate, onSwipeLeft, onSwipeRight }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef<{
    startX: number
    startY: number
    dx: number
    locked: boolean | null
  } | null>(null)
  const animatingRef = useRef(false)

  const prevMonth = useMemo(() => subMonths(displayDate, 1), [displayDate])
  const nextMonth = useMemo(() => addMonths(displayDate, 1), [displayDate])

  /** Translate the strip by a pixel offset from center. 0 = current month visible. */
  const setStripPx = useCallback((px: number, transition?: string) => {
    const el = stripRef.current
    if (!el) return
    el.style.transition = transition ?? 'none'
    el.style.transform = `translateX(calc(-33.333% + ${px}px))`
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (animatingRef.current) return
    const t = e.touches[0]
    touchRef.current = { startX: t.clientX, startY: t.clientY, dx: 0, locked: null }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = touchRef.current
      if (!touch || animatingRef.current) return
      const t = e.touches[0]
      const dx = t.clientX - touch.startX
      const dy = t.clientY - touch.startY

      if (touch.locked === null) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          touch.locked = Math.abs(dx) > Math.abs(dy)
        }
        if (!touch.locked) return
      }
      if (!touch.locked) return

      touch.dx = dx
      setStripPx(dx)
    },
    [setStripPx]
  )

  const handleTouchEnd = useCallback(() => {
    const touch = touchRef.current
    if (!touch || animatingRef.current) {
      touchRef.current = null
      return
    }

    const dx = touch.dx
    touchRef.current = null
    const committed = touch.locked && Math.abs(dx) > SWIPE_THRESHOLD
    const nav = committed ? (dx < 0 ? onSwipeLeft : onSwipeRight) : null

    if (!committed) {
      setStripPx(0, `transform ${SETTLE_MS}ms ease-out`)
      return
    }

    animatingRef.current = true
    const viewW = stripRef.current?.parentElement?.offsetWidth ?? 400
    const targetPx = dx < 0 ? -viewW : viewW
    setStripPx(targetPx, `transform ${SETTLE_MS}ms ease-out`)

    setTimeout(() => {
      flushSync(() => nav?.())
    }, SETTLE_MS)
  }, [onSwipeLeft, onSwipeRight, setStripPx])

  const allReminders = useRemindersStore((s) => s.reminders)

  const {
    days,
    remindersByDate,
    noteCountByDate,
    listCountByDate,
    selectedPlainDate,
    isSameDay,
    gridRef,
    glow,
    handleDayClick,
    handleReminderClick,
    handleNoteClick,
    handleTodoClick,
    handleGridMouseMove,
    handleGridMouseLeave,
  } = useMonthView({ displayDate })

  // Runs synchronously after React commits the new displayDate DOM update,
  // but before the browser paints — resets strip to center with no flash.
  useLayoutEffect(() => {
    const el = stripRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = 'translateX(-33.333%)'
    animatingRef.current = false
  }, [displayDate])

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-[12px] font-semibold text-slate-400 dark:text-white/55"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={stripRef}
          style={{
            display: 'flex',
            width: '300%',
            transform: 'translateX(-33.333%)',
            willChange: 'transform',
          }}
        >
          {/* Previous month */}
          <AdjacentMonthGrid
            date={prevMonth}
            reminders={allReminders}
            noteCountByDate={noteCountByDate}
            listCountByDate={listCountByDate}
          />

          {/* Current month */}
          <div
            ref={gridRef}
            onMouseMove={handleGridMouseMove}
            onMouseLeave={handleGridMouseLeave}
            style={{
              backgroundImage: glow.active
                ? `radial-gradient(circle at ${glow.x}px ${glow.y}px, rgba(255,255,255,0.008) 0%, transparent 100px)`
                : 'none',
            }}
            className="grid grid-cols-7 auto-rows-[80px] md:auto-rows-[110px] lg:auto-rows-[160px] gap-0 md:gap-1 bg-[var(--bg-app)] p-0 md:p-1.5 shrink-0 w-[calc(100%/3)]"
          >
            {days.map((day) => (
              <CalendarDay
                key={day.toString()}
                date={day}
                displayMonth={displayDate}
                reminders={remindersByDate[day.toString()] ?? []}
                listCount={listCountByDate[day.toString()] ?? 0}
                noteCount={noteCountByDate[day.toString()] ?? 0}
                isSelected={isSameDay(day, selectedPlainDate)}
                onClick={() => handleDayClick(day)}
                onReminderClick={() => handleReminderClick(day)}
                onNoteClick={() => handleNoteClick(day)}
                onTodoClick={() => handleTodoClick(day)}
              />
            ))}
          </div>

          {/* Next month */}
          <AdjacentMonthGrid
            date={nextMonth}
            reminders={allReminders}
            noteCountByDate={noteCountByDate}
            listCountByDate={listCountByDate}
          />
        </div>
      </div>
    </div>
  )
}
