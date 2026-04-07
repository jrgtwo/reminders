import { useEffect, useRef } from 'react'
import { useRemindersStore } from '../store/reminders.store'
import { getOccurrencesInRange } from '../utils/recurrence'
import { today } from '../utils/dates'

function currentTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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

      function check() {
        if (Notification.permission !== 'granted') return

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

          const title = r.title
          const options = { body: r.description ?? `Reminder at ${time}` }

          if (swReg.current) {
            swReg.current.showNotification(title, options)
          } else {
            new Notification(title, options)
          }
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
