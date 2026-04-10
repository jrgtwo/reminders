import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../../store/ui.store'
import { useRemindersStore } from '../../../store/reminders.store'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { today as todayDate, parseDateStr } from '../../../utils/dates'

export function formatOverdueDate(dateStr: string): string {
  const t = todayDate()
  const d = parseDateStr(dateStr)
  const diff = d.until(t, { largestUnit: 'days' }).days
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

export function formatUpcomingDate(dateStr: string): string {
  const t = todayDate()
  const d = parseDateStr(dateStr)
  const diff = t.until(d, { largestUnit: 'days' }).days
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

type OverdueSub = 'yesterday' | 'thisweek' | 'older'
type UpcomingSub = 'today' | 'thisweek' | 'later'

export function useLeftSidebar() {
  const leftOpen = useUIStore((s) => s.leftOpen)
  const setLeftOpen = useUIStore((s) => s.setLeftOpen)
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)
  const reminderSections = useUIStore((s) => s.reminderSections)
  const setReminderSection = useUIStore((s) => s.setReminderSection)
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)

  const [width, setWidth] = useState(240)
  const dragging = useRef(false)
  const asideRef = useRef<HTMLElement>(null)

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startWidth = width
    const el = asideRef.current!
    el.style.transition = 'none'
    let lastWidth = startWidth

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return
      lastWidth = Math.max(180, Math.min(520, startWidth + ev.clientX - startX))
      el.style.width = lastWidth + 'px'
    }
    function onMouseUp() {
      dragging.current = false
      el.style.transition = ''
      setWidth(lastWidth)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const t = useMemo(() => todayDate(), [])
  const yesterday = useMemo(() => t.subtract({ days: 1 }), [t])
  const weekStart = useMemo(() => t.subtract({ days: t.dayOfWeek - 1 }), [t])
  const weekEnd = useMemo(() => weekStart.add({ days: 6 }), [weekStart])

  const overdue = useMemo(() => {
    const start = t.subtract({ days: 365 })
    const end = yesterday
    const items: { id: string; title: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, dateStr })
      }
    }
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    return items
  }, [reminders, t, yesterday])

  const upcoming = useMemo(() => {
    const start = todayDate()
    const end = start.add({ days: 30 })
    const items: { id: string; title: string; startTime?: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, startTime: r.startTime, dateStr })
      }
    }
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return items
  }, [reminders])

  const overdueYesterday = overdue.filter((i) => i.dateStr === yesterday.toString())
  const overdueThisWeek = overdue.filter(
    (i) => i.dateStr >= weekStart.toString() && i.dateStr < yesterday.toString()
  )
  const overdueOlder = overdue.filter((i) => i.dateStr < weekStart.toString())

  const upcomingToday = upcoming.filter((i) => i.dateStr === t.toString())
  const upcomingThisWeek = upcoming.filter(
    (i) => i.dateStr > t.toString() && i.dateStr <= weekEnd.toString()
  )
  const upcomingLater = upcoming.filter((i) => i.dateStr > weekEnd.toString())

  const [overdueSubOpen, setOverdueSubOpen] = useState<OverdueSub | null>(null)
  const [upcomingSubOpen, setUpcomingSubOpen] = useState<UpcomingSub | null>(null)

  useEffect(() => {
    if (!reminderSections.overdue) return
    if (overdueYesterday.length > 0) setOverdueSubOpen('yesterday')
    else if (overdueThisWeek.length > 0) setOverdueSubOpen('thisweek')
    else if (overdueOlder.length > 0) setOverdueSubOpen('older')
  }, [reminderSections.overdue])

  useEffect(() => {
    if (!reminderSections.upcoming) return
    if (upcomingToday.length > 0) setUpcomingSubOpen('today')
    else if (upcomingThisWeek.length > 0) setUpcomingSubOpen('thisweek')
    else if (upcomingLater.length > 0) setUpcomingSubOpen('later')
  }, [reminderSections.upcoming])

  return {
    leftOpen,
    setLeftOpen,
    width,
    asideRef,
    onResizeStart,
    setNewReminderDate,
    reminderSections,
    setReminderSection,
    navigate,
    t,
    overdue,
    upcoming,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingToday,
    upcomingThisWeek,
    upcomingLater,
    overdueSubOpen,
    setOverdueSubOpen,
    upcomingSubOpen,
    setUpcomingSubOpen,
  }
}
