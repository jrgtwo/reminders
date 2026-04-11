import { useMemo, useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getWeekDays, parseDateStr } from '../../../utils/dates'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { useRemindersStore } from '../../../store/reminders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { useUIStore } from '../../../store/ui.store'
import type { Reminder } from '../../../types/models'

const SLOT_H = 64

interface Params {
  displayDate: Temporal.PlainDate
}

export function useWeekView({ displayDate }: Params) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const lists = useTodoListsStore((s) => s.lists)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  const timeFormat = useUIStore((s) => s.timeFormat)
  const saveReminder = useRemindersStore((s) => s.save)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [newForm, setNewForm] = useState<{ date: string; time: string } | null>(null)
  const [detail, setDetail] = useState<{ reminder: Reminder; dateStr: string } | null>(null)
  const [allDayExpanded, setAllDayExpanded] = useState(false)

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

  const maxAllDayCount = useMemo(() => {
    let max = 0
    for (const day of days) {
      const dateStr = day.toString()
      const count = (allDayByDate[dateStr] ?? []).length + (listCountByDate[dateStr] ? 1 : 0)
      if (count > max) max = count
    }
    return max
  }, [days, allDayByDate, listCountByDate])

  const COLLAPSED_LIMIT = 2

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
      const container = scrollRef.current
      container.scrollTop = Math.max(0, (now.hour - 2) * SLOT_H)
      const todayIndex = days.findIndex((d) => d.toString() === todayStr)
      if (todayIndex !== -1) {
        const labelWidth = 56
        const colWidth = (container.scrollWidth - labelWidth) / 7
        const colLeft = labelWidth + todayIndex * colWidth
        container.scrollLeft = Math.max(0, colLeft - (container.clientWidth - colWidth) / 2)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDayClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`)
  }

  async function handleSaveNewReminder(r: Reminder) {
    await saveReminder(r)
    setNewForm(null)
  }

  return {
    scrollRef,
    newForm,
    setNewForm,
    detail,
    setDetail,
    days,
    listCountByDate,
    timedByDate,
    allDayByDate,
    multiDayReminders,
    selectedPlainDate,
    todayStr,
    nowTop,
    hasAllDay,
    hasSingleDayAllDay,
    allDayExpanded,
    setAllDayExpanded,
    maxAllDayCount,
    COLLAPSED_LIMIT,
    timeFormat,
    navigate,
    getColSpan,
    handleDayClick,
    handleSaveNewReminder,
    SLOT_H,
  }
}
