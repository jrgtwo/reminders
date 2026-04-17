import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getMonthGrid, isSameDay, parseDateStr } from '../../../utils/dates'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { useRemindersStore } from '../../../store/reminders.store'
import { useNotesStore } from '../../../store/notes.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { useUIStore } from '../../../store/ui.store'

interface Params {
  displayDate: Temporal.PlainDate
}

export function useMonthView({ displayDate }: Params) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const notes = useNotesStore((s) => s.notes)
  const lists = useTodoListsStore((s) => s.lists)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const days = useMemo(() => getMonthGrid(displayDate), [displayDate])

  const remindersByDate = useMemo(() => {
    const gridStart = days[0]
    const gridEnd = days[days.length - 1]
    const map: Record<string, ReturnType<typeof useRemindersStore.getState>['reminders'][number][]> = {}
    for (const reminder of reminders) {
      for (const dateStr of getOccurrencesInRange(reminder, gridStart, gridEnd)) {
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(reminder)
      }
    }
    return map
  }, [reminders, days])

  const noteCountByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const n of notes.values()) {
      if (n.date) map[n.date] = (map[n.date] ?? 0) + 1
    }
    return map
  }, [notes])

  const listCountByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const l of lists) {
      if (!l.dueDate) continue
      map[l.dueDate] = (map[l.dueDate] ?? 0) + 1
    }
    return map
  }, [lists])

  const selectedPlainDate = useMemo(() => parseDateStr(selectedDate), [selectedDate])

  const gridRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false })

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

  function handleGridMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!gridRef.current) return
    if (window.innerWidth < 768) return
    const rect = gridRef.current.getBoundingClientRect()
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true })
  }

  function handleGridMouseLeave() {
    setGlow((g) => ({ ...g, active: false }))
  }

  return {
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
  }
}
