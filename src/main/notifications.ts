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
    if (!r.startTime || r.startTime !== time) continue
    if (!hasOccurrenceToday(r, today)) continue
    if (r.completedDates.includes(today)) continue

    const key = `${r.id}-${today}-${time}`
    if (fired.has(key)) continue
    fired.add(key)

    const { showNotificationContent } = loadPreferences()
    new Notification({
      title: showNotificationContent ? r.title : 'Reminder',
      body: showNotificationContent ? (r.description ?? `Reminder at ${time}`) : `You have a reminder at ${time}`,
    }).show()
  }
}

export function startNotificationScheduler(): void {
  checkAndFire()
  setInterval(checkAndFire, 10_000)
}
