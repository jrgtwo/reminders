import { Notification, dialog } from 'electron'
import { RRule } from 'rrule'
import { getAllReminders } from './storage/reminders.repo'
import { loadPreferences } from './preferences'
import type { Reminder } from '../renderer/src/types/models'

export const SNOOZE_OPTIONS = [5, 10, 15, 30, 60, 120] as const

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const

const WEEKDAYS = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function currentTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function hasOccurrenceToday(reminder: Reminder, today: string): boolean {
  if (!reminder.recurrence) {
    return reminder.date === today
  }
  const { frequency, interval, endDate, count, byDay } = reminder.recurrence
  const rule = new RRule({
    freq: FREQ_MAP[frequency],
    interval,
    dtstart: toUTCDate(reminder.date),
    until: endDate ? toUTCDate(endDate) : undefined,
    count,
    byweekday: byDay ? byDay.map((i) => WEEKDAYS[i]) : undefined,
  })
  const start = toUTCDate(today)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return rule.between(start, end, true).length > 0
}

// Tracks notifications already fired this session to avoid duplicates within the same minute
const fired = new Set<string>()

interface SnoozedEntry {
  until: number
  reminder: Reminder
  date: string
}

// In-memory snooze state — lost on app restart (acceptable for short-lived snoozes)
const snoozed = new Map<string, SnoozedEntry>()

/** Snooze a reminder so it re-fires after `minutes`. */
export function snoozeReminder(reminderId: string, date: string, minutes: number): void {
  let reminders: Reminder[]
  try {
    reminders = getAllReminders()
  } catch {
    return
  }
  const reminder = reminders.find((r) => r.id === reminderId)
  if (!reminder) return

  const key = `${reminderId}-${date}`
  snoozed.set(key, { until: Date.now() + minutes * 60_000, reminder, date })

  // Remove from fired so the snooze re-fire won't be blocked
  for (const firedKey of fired) {
    if (firedKey.startsWith(`${reminderId}-${date}-`)) {
      fired.delete(firedKey)
    }
  }
}

/** Returns active snooze entries for the renderer to display badges. */
export function getActiveSnoozed(): Array<{ reminderId: string; date: string; until: number }> {
  const result: Array<{ reminderId: string; date: string; until: number }> = []
  for (const [, entry] of snoozed) {
    result.push({ reminderId: entry.reminder.id, date: entry.date, until: entry.until })
  }
  return result
}

/** Subtract `minutes` from an "HH:MM" time string. Returns { date offset (-1/0), time "HH:MM" }. */
function subtractMinutes(timeStr: string, minutes: number): { dayOffset: number; time: string } {
  const [h, m] = timeStr.split(':').map(Number)
  let total = h * 60 + m - minutes
  let dayOffset = 0
  while (total < 0) {
    total += 24 * 60
    dayOffset -= 1
  }
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return { dayOffset, time: `${hh}:${mm}` }
}

function fireNotification(reminder: Reminder, occurrenceDate: string, label: string): void {
  const { showNotificationContent } = loadPreferences()
  const notif = new Notification({
    title: showNotificationContent ? reminder.title : 'Reminder',
    body: showNotificationContent
      ? (reminder.description ?? `Reminder ${label}`)
      : `You have a reminder ${label}`,
  })

  notif.on('click', () => {
    const buttons = ['Dismiss', ...SNOOZE_OPTIONS.map((m) => (m < 60 ? `${m} min` : `${m / 60} hour${m > 60 ? 's' : ''}`))]
    dialog
      .showMessageBox({
        type: 'info',
        title: reminder.title,
        message: 'Snooze this reminder?',
        buttons,
        defaultId: 0,
        cancelId: 0,
      })
      .then(({ response }) => {
        if (response > 0) {
          snoozeReminder(reminder.id, occurrenceDate, SNOOZE_OPTIONS[response - 1])
        }
      })
  })

  notif.show()
}

function checkAndFire(): void {
  const today = todayStr()
  const time = currentTimeStr()

  // Check snoozed reminders
  const now = Date.now()
  for (const [key, entry] of snoozed) {
    if (now >= entry.until) {
      snoozed.delete(key)
      fireNotification(entry.reminder, entry.date, 'snoozed')
    }
  }

  let reminders: Reminder[]
  try {
    reminders = getAllReminders()
  } catch {
    return // DB may not be initialised yet on first tick
  }

  for (const r of reminders) {
    if (!r.startTime) continue

    const notifyMinutes = r.notifyBefore ?? 0
    const { dayOffset, time: fireTime } = subtractMinutes(r.startTime, notifyMinutes)

    if (fireTime !== time) continue

    // Determine which day the occurrence should fall on
    const occurrenceDate = dayOffset === 0
      ? today
      : new Date(new Date(today + 'T00:00:00').getTime() - dayOffset * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)

    if (!hasOccurrenceToday(r, occurrenceDate)) continue
    if (r.completedDates.includes(occurrenceDate)) continue

    // Skip if currently snoozed
    if (snoozed.has(`${r.id}-${occurrenceDate}`)) continue

    const key = `${r.id}-${occurrenceDate}-${fireTime}`
    if (fired.has(key)) continue
    fired.add(key)

    const label = notifyMinutes > 0 ? `in ${formatMinutes(notifyMinutes)}` : `at ${r.startTime}`
    fireNotification(r, occurrenceDate, label)
  }
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`
  return `${h}h ${m}m`
}

export function startNotificationScheduler(): void {
  checkAndFire()
  setInterval(checkAndFire, 10_000)
}
