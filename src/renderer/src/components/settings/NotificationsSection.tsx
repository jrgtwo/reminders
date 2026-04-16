import { useState, useEffect } from 'react'

const SNOOZE_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
]

const STORAGE_KEY = 'snoozeDuration'

function loadSnoozeDuration(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val) return Number(val)
  } catch {
    // ignore
  }
  return 10
}

export function saveSnoozeDuration(minutes: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(minutes))
  } catch {
    // ignore
  }
}

export function getSnoozeDuration(): number {
  return loadSnoozeDuration()
}

export default function NotificationsSection() {
  const [snoozeDuration, setSnoozeDuration] = useState(10)
  const isElectron = !!(window as any).electronAPI?.preferences

  useEffect(() => {
    if (isElectron) {
      const api = (window as any).electronAPI
      api.preferences.get().then((prefs: { snoozeDuration?: number }) => {
        const val = prefs.snoozeDuration ?? 10
        setSnoozeDuration(val)
        saveSnoozeDuration(val)
      })
    } else {
      setSnoozeDuration(loadSnoozeDuration())
    }
  }, [isElectron])

  const handleChange = (value: number) => {
    setSnoozeDuration(value)
    saveSnoozeDuration(value)
    if (isElectron) {
      const api = (window as any).electronAPI
      api.preferences.set({ snoozeDuration: value })
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Notifications
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Snooze duration</p>
            <p className="text-xs text-gray-400 mt-0.5">
              How long to snooze a reminder when you tap the snooze button
            </p>
          </div>
          <select
            value={snoozeDuration}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="text-sm bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            {SNOOZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}
