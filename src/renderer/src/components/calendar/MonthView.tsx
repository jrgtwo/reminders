import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getMonthGrid, isSameDay, parseDateStr } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import CalendarDay from './CalendarDay'
import { useRemindersStore } from '../../store/reminders.store'
import { useNotesStore } from '../../store/notes.store'
import { useTodosStore } from '../../store/todos.store'
import { useUIStore } from '../../store/ui.store'
import type { Reminder, Todo } from '../../types/models'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  displayDate: Temporal.PlainDate
}

export default function MonthView({ displayDate }: Props) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const noteDates = useNotesStore((s) => s.noteDates)
  const todos = useTodosStore((s) => s.todos)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const days = useMemo(() => getMonthGrid(displayDate), [displayDate])

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

  const todosByDate = useMemo(() => {
    const gridStart = days[0].toString()
    const gridEnd = days[days.length - 1].toString()
    const map: Record<string, Todo[]> = {}
    for (const t of todos) {
      if (!t.dueDate || t.completed) continue
      if (t.dueDate < gridStart || t.dueDate > gridEnd) continue
      if (!map[t.dueDate]) map[t.dueDate] = []
      map[t.dueDate].push(t)
    }
    return map
  }, [todos, days])

  const selectedPlainDate = useMemo(() => parseDateStr(selectedDate), [selectedDate])

  function handleDayClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`)
  }

  function handleReminderClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })
  }

  function handleNoteClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`, { state: { tab: 'notes' } })
  }

  function handleTodoClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`, { state: { tab: 'todos' } })
  }

  const gridRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, clientX: 0, clientY: 0, active: false })

  function handleGridMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, clientX: e.clientX, clientY: e.clientY, active: true })
  }

  function handleGridMouseLeave() {
    setGlow((g) => ({ ...g, active: false }))
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-[12px] font-semibold text-slate-400 dark:text-white/35"
          >
            {name}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div
        ref={gridRef}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
        style={{
          backgroundImage: glow.active
            ? `radial-gradient(circle at ${glow.x}px ${glow.y}px, rgba(255,255,255,0.008) 0%, transparent 100px)`
            : 'none',
        }}
        className="grid grid-cols-7 auto-rows-[80px] md:auto-rows-[110px] lg:auto-rows-[160px] gap-1 bg-[var(--bg-app)] p-1.5"
      >
        {days.map((day) => (
          <CalendarDay
            key={day.toString()}
            date={day}
            displayMonth={displayDate}
            reminders={remindersByDate[day.toString()] ?? []}
            todos={todosByDate[day.toString()] ?? []}
            hasNote={noteDates.includes(day.toString())}
            isSelected={isSameDay(day, selectedPlainDate)}
            isWeekend={day.dayOfWeek === 6 || day.dayOfWeek === 7}
            mouseClientX={glow.clientX}
            mouseClientY={glow.clientY}
            mouseActive={glow.active}
            onClick={() => handleDayClick(day)}
            onReminderClick={() => handleReminderClick(day)}
            onNoteClick={() => handleNoteClick(day)}
            onTodoClick={() => handleTodoClick(day)}
          />
        ))}
      </div>
    </div>
  )
}
