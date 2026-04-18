import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRemindersStore } from '../../../store/reminders.store'
import { useUIStore } from '../../../store/ui.store'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { today, parseDateStr } from '../../../utils/dates'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { Reminder } from '../../../types/models'

export interface ScheduleItem {
  id: string
  title: string
  description?: string
  startTime?: string
  recurrence?: Reminder['recurrence']
  dateStr: string
  isRecurring: boolean
}

export function formatOverdueDate(dateStr: string): string {
  const d = parseDateStr(dateStr)
  const t = today()
  const diff = d.until(t, { largestUnit: 'days' }).days
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

export function formatUpcomingDate(dateStr: string): string {
  const t = today()
  const d = parseDateStr(dateStr)
  const diff = t.until(d, { largestUnit: 'days' }).days
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function useMobileRemindersPage() {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const toggleComplete = useRemindersStore((s) => s.toggleComplete)
  const removeReminder = useRemindersStore((s) => s.remove)
  const saveReminder = useRemindersStore((s) => s.save)
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)

  const t = useMemo(() => today(), [])
  const yesterday = useMemo(() => t.subtract({ days: 1 }), [t])
  const weekStart = useMemo(() => t.subtract({ days: t.dayOfWeek - 1 }), [t])
  const weekEnd = useMemo(() => weekStart.add({ days: 6 }), [weekStart])
  const tomorrow = useMemo(() => t.add({ days: 1 }), [t])

  const overdue = useMemo(() => {
    const start = t.subtract({ days: 365 })
    const end = yesterday
    const items: ScheduleItem[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        if (r.completedDates.includes(dateStr)) continue
        items.push({
          id: r.id,
          title: r.title,
          description: r.description,
          startTime: r.startTime,
          recurrence: r.recurrence,
          dateStr,
          isRecurring: !!r.recurrence
        })
      }
    }
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    return items
  }, [reminders, t, yesterday])

  const todayItems = useMemo(() => {
    const items: ScheduleItem[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, t, t)) {
        if (r.completedDates.includes(dateStr)) continue
        items.push({
          id: r.id,
          title: r.title,
          description: r.description,
          startTime: r.startTime,
          recurrence: r.recurrence,
          dateStr,
          isRecurring: !!r.recurrence
        })
      }
    }
    items.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    return items
  }, [reminders, t])

  const upcoming = useMemo(() => {
    const start = tomorrow
    const end = t.add({ days: 30 })
    const items: ScheduleItem[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        if (r.completedDates.includes(dateStr)) continue
        items.push({
          id: r.id,
          title: r.title,
          description: r.description,
          startTime: r.startTime,
          recurrence: r.recurrence,
          dateStr,
          isRecurring: !!r.recurrence
        })
      }
    }
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return items
  }, [reminders, t, tomorrow])

  const overdueYesterday = overdue.filter((i) => i.dateStr === yesterday.toString())
  const overdueThisWeek = overdue.filter(
    (i) => i.dateStr >= weekStart.toString() && i.dateStr < yesterday.toString()
  )
  const overdueOlder = overdue.filter((i) => i.dateStr < weekStart.toString())

  const upcomingThisWeek = upcoming.filter((i) => i.dateStr <= weekEnd.toString())
  const upcomingLater = upcoming.filter((i) => i.dateStr > weekEnd.toString())

  const isEmpty = overdue.length === 0 && todayItems.length === 0 && upcoming.length === 0

  const reminderDelete = useConfirmDelete(useCallback((id: string) => {
    removeReminder(id)
  }, [removeReminder]))

  function handleDeleteReminder(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    reminderDelete.requestDelete(id, rect, 'Delete this reminder? This cannot be undone.')
  }

  async function clearAllOverdue() {
    for (const item of overdue) {
      await toggleComplete(item.id, item.dateStr)
    }
  }

  async function handleSnooze(item: ScheduleItem) {
    const reminder = reminders.find((r) => r.id === item.id)
    if (!reminder) return
    if (reminder.recurrence) {
      await toggleComplete(reminder.id, item.dateStr)
    } else {
      await saveReminder({
        ...reminder,
        date: tomorrow.toString(),
        updatedAt: new Date().toISOString()
      })
    }
  }

  return {
    navigate,
    reminders,
    toggleComplete,
    handleDeleteReminder,
    reminderDelete,
    setNewReminderDate,
    overdue,
    todayItems,
    upcoming,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingThisWeek,
    upcomingLater,
    isEmpty,
    handleSnooze,
    clearAllOverdue
  }
}
