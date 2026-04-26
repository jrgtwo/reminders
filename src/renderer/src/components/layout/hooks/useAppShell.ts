import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../../store/ui.store'
import { useRemindersStore } from '../../../store/reminders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { useAuthStore } from '../../../store/auth.store'
import { useSyncStore } from '../../../store/sync.store'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { today } from '../../../utils/dates'
import { usePageTracking } from '../../../hooks/usePageTracking'

export function useAppShell() {
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [errorDismissed, setErrorDismissed] = useState(false)

  const newReminderDate = useUIStore((s) => s.newReminderDate)
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)
  const saveReminder = useRemindersStore((s) => s.save)
  const reminders = useRemindersStore((s) => s.reminders)
  const lists = useTodoListsStore((s) => s.lists)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const plan = useAuthStore((s) => s.plan)

  const overdueCount = useMemo(() => {
    const end = today().subtract({ days: 1 })
    const start = end.subtract({ days: 365 })
    let count = 0
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        if (!r.completedDates.includes(dateStr)) count++
      }
    }
    return count
  }, [reminders])

  const upcomingCount = useMemo(() => {
    const start = today()
    const end = start.add({ days: 30 })
    let count = 0
    for (const r of reminders) {
      count += getOccurrencesInRange(r, start, end).length
    }
    return count
  }, [reminders])

  const syncStatus = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)

  const prevSyncStatus = useRef(syncStatus)
  useEffect(() => {
    if (prevSyncStatus.current === 'syncing' && syncStatus === 'error') {
      setErrorDismissed(false)
    }
    prevSyncStatus.current = syncStatus
  }, [syncStatus])

  const showErrorBanner = isLoggedIn && syncStatus === 'error' && !errorDismissed

  usePageTracking()

  return {
    searchRef,
    navigate,
    errorDismissed,
    setErrorDismissed,
    newReminderDate,
    setNewReminderDate,
    saveReminder,
    lists,
    isLoggedIn,
    plan,
    overdueCount,
    upcomingCount,
    syncStatus,
    lastSyncedAt,
    showErrorBanner,
  }
}
