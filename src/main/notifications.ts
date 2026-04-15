import { Notification } from 'electron'
import { RRule } from 'rrule'
import { getAllReminders } from './storage/reminders.repo'
import { loadPreferences } from './preferences'
import type { Reminder } from '../renderer/src/types/models'

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

function checkAndFire(): void {
  const today = todayStr()
  const time = currentTimeStr()

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

    const key = `${r.id}-${occurrenceDate}-${fireTime}`
    if (fired.has(key)) continue
    fired.add(key)

    const { showNotificationContent } = loadPreferences()
    const label = notifyMinutes > 0 ? `in ${formatMinutes(notifyMinutes)}` : `at ${r.startTime}`
    new Notification({
      title: showNotificationContent ? r.title : 'Reminder',
      body: showNotificationContent
        ? (r.description ?? `Reminder ${label}`)
        : `You have a reminder ${label}`,
    }).show()
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
