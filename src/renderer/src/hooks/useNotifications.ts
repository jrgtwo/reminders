import { useEffect, useRef } from 'react'
import { useRemindersStore } from '../store/reminders.store'
import { getOccurrencesInRange } from '../utils/recurrence'
import { today } from '../utils/dates'
import type { Reminder } from '../types/models'

function currentTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

interface SnoozedEntry {
  until: number
  reminder: Reminder
  date: string
}

// Shared snooze state for web context — accessible from components via snoozeWebReminder()
const webSnoozed = new Map<string, SnoozedEntry>()

/**
 * Snooze a reminder in the web context. Schedules a re-notification after `minutes`.
 */
export function snoozeWebReminder(reminderId: string, date: string, minutes: number): void {
  const reminders = useRemindersStore.getState().reminders
  const reminder = reminders.find((r) => r.id === reminderId)
  if (!reminder) return

  const key = `${reminderId}-${date}`
  webSnoozed.set(key, {
    until: Date.now() + minutes * 60_000,
    reminder,
    date,
  })
}

// Only used in the web context. Electron handles notifications in the main process.
export function useNotifications(): void {
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
  const reminders = useRemindersStore((s) => s.reminders)
  const fired = useRef(new Set<string>())
  const swReg = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (isElectron) return
    if (!('Notification' in window)) return

    let intervalId: ReturnType<typeof setInterval> | undefined
    let cancelled = false

    async function init() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (cancelled) return

      // Register service worker so showNotification() works on mobile Chrome.
      // Desktop falls back to new Notification() if SW is unavailable.
      if ('serviceWorker' in navigator) {
        try {
          swReg.current = await navigator.serviceWorker.register('/sw.js')
          await navigator.serviceWorker.ready
        } catch {
          // SW registration failed — will fall back to new Notification()
        }
      }
      if (cancelled) return

      function fireNotification(title: string, body: string) {
        const options = { body }
        if (swReg.current) {
          swReg.current.showNotification(title, options)
        } else {
          new Notification(title, options)
        }
      }

      function check() {
        if (Notification.permission !== 'granted') return

        // Check snoozed reminders first
        const now = Date.now()
        for (const [key, entry] of webSnoozed) {
          if (now >= entry.until) {
            webSnoozed.delete(key)
            fireNotification(entry.reminder.title, entry.reminder.description ?? 'Snoozed reminder')
          }
        }

        const t = today()
        const todayStr = t.toString()
        const time = currentTimeStr()

        for (const r of reminders) {
          if (!r.startTime || r.startTime !== time) continue
          if (getOccurrencesInRange(r, t, t).length === 0) continue
          if (r.completedDates.includes(todayStr)) continue

          const key = `${r.id}-${todayStr}-${time}`
          if (fired.current.has(key)) continue
          fired.current.add(key)

          fireNotification(r.title, r.description ?? `Reminder at ${time}`)
        }
      }

      check()
      intervalId = setInterval(check, 10_000)
    }

    init()

    return () => {
      cancelled = true
      if (intervalId !== undefined) clearInterval(intervalId)
    }
  }, [reminders, isElectron])
}
