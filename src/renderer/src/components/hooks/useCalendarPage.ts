import { useEffect, useMemo, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { useUIStore } from '../../store/ui.store'
import { useRemindersStore } from '../../store/reminders.store'
import { useNotesStore } from '../../store/notes.store'
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeekDays,
  today,
  parseDateStr
} from '../../utils/dates'

export function useCalendarPage() {
  const navigate = useNavigate()
  const selectedDateStr = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  const currentView = useUIStore((s) => s.currentView)
  const setView = useUIStore((s) => s.setView)
  const load = useRemindersStore((s) => s.load)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const [, startTransition] = useTransition()

  const [displayDate, setDisplayDate] = useState<Temporal.PlainDate>(() =>
    parseDateStr(selectedDateStr)
  )

  useEffect(() => {
    load()
    loadNotes()
  }, [load, loadNotes])

  const view: 'month' | 'week' = currentView === 'week' ? 'week' : 'month'
  const weekDays = useMemo(() => getWeekDays(displayDate), [displayDate])

  function handlePrev() {
    startTransition(() => {
      setDisplayDate((d: Temporal.PlainDate) => (view === 'week' ? subWeeks(d, 1) : subMonths(d, 1)))
    })
  }

  function handleNext() {
    startTransition(() => {
      setDisplayDate((d: Temporal.PlainDate) => (view === 'week' ? addWeeks(d, 1) : addMonths(d, 1)))
    })
  }

  function handleToday() {
    const t = today()
    navigate(`/day/${t.toString()}`)
    startTransition(() => {
      setDisplayDate(t)
      setSelectedDate(t.toString())
    })
  }

  function handleViewChange(v: 'month' | 'week') {
    startTransition(() => {
      setView(v)
    })
  }

  function handleNavigate(date: Temporal.PlainDate) {
    startTransition(() => {
      setDisplayDate(date)
    })
  }

  return {
    displayDate,
    view,
    weekDays,
    handlePrev,
    handleNext,
    handleToday,
    handleNavigate,
    setView: handleViewChange
  }
}
