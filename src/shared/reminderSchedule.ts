import { RRule } from 'rrule'

export interface SchedulableReminder {
  id: string
  title: string
  description?: string
  date: string
  startTime?: string
  notifyBefore?: number
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
    count?: number
    byDay?: number[]
  }
  completedDates: string[]
}

export interface PendingNotification {
  id: number
  scheduleAt: Date
}

export interface ScheduledNotification {
  id: number
  reminderId: string
  fireAt: Date
  title: string
  body: string
}

export interface ReconcileOptions {
  horizon?: number
  daysAhead?: number
}

export interface ReconcileResult {
  toSchedule: ScheduledNotification[]
  toCancel: number[]
}

const DEFAULT_HORIZON = 50
const DEFAULT_DAYS_AHEAD = 30
const TOMBSTONE_YEAR = 2099

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const

const WEEKDAYS = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]

export function uuidToInt(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 8)
  return Math.abs(parseInt(hex, 16)) || 1
}

export function tombstoneDate(): Date {
  return new Date(TOMBSTONE_YEAR, 0, 1)
}

export function isTombstone(scheduleAt: Date): boolean {
  return scheduleAt.getFullYear() >= TOMBSTONE_YEAR
}

function dateStrToUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function utcToDateStr(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildRRule(r: SchedulableReminder): RRule {
  const rec = r.recurrence!
  return new RRule({
    freq: FREQ_MAP[rec.frequency],
    interval: rec.interval,
    dtstart: dateStrToUTC(r.date),
    until: rec.endDate ? dateStrToUTC(rec.endDate) : undefined,
    count: rec.count,
    byweekday: rec.byDay ? rec.byDay.map((d) => WEEKDAYS[d]) : undefined,
  })
}

function fireTimeForOccurrence(dateStr: string, startTime: string, notifyBefore: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hour, minute] = startTime.split(':').map(Number)
  const fire = new Date(y, m - 1, d, hour, minute, 0, 0)
  if (notifyBefore > 0) fire.setMinutes(fire.getMinutes() - notifyBefore)
  return fire
}

export function nextOccurrenceAt(reminder: SchedulableReminder, now: Date): Date | null {
  if (!reminder.startTime) return null
  const notifyBefore = reminder.notifyBefore ?? 0

  if (!reminder.recurrence) {
    if (reminder.completedDates.includes(reminder.date)) return null
    const fire = fireTimeForOccurrence(reminder.date, reminder.startTime, notifyBefore)
    return fire > now ? fire : null
  }

  const rule = buildRRule(reminder)
  const completed = new Set(reminder.completedDates)

  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const oneYearOut = new Date(startOfToday.getTime() + 365 * 24 * 60 * 60 * 1000)

  let cursor: Date | null = startOfToday
  for (let i = 0; i < 366; i++) {
    const occ: Date | null = rule.after(cursor, true)
    if (!occ || occ > oneYearOut) return null

    const occDate = utcToDateStr(occ)
    if (!completed.has(occDate)) {
      const fire = fireTimeForOccurrence(occDate, reminder.startTime, notifyBefore)
      if (fire > now) return fire
    }

    cursor = new Date(occ.getTime() + 1)
  }
  return null
}

function formatNotificationBody(r: SchedulableReminder): string {
  if (r.description) return r.description
  const notify = r.notifyBefore ?? 0
  if (notify > 0) return `Reminder in ${formatMinutes(notify)}`
  return r.startTime ? `Reminder at ${r.startTime}` : 'Reminder'
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`
  return `${h}h ${m}m`
}

export function reconcileSchedule(
  allReminders: SchedulableReminder[],
  currentlyPending: PendingNotification[],
  now: Date,
  options: ReconcileOptions = {},
): ReconcileResult {
  const horizon = options.horizon ?? DEFAULT_HORIZON
  const daysAhead = options.daysAhead ?? DEFAULT_DAYS_AHEAD
  const horizonEnd = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const candidates: ScheduledNotification[] = []
  for (const r of allReminders) {
    const fire = nextOccurrenceAt(r, now)
    if (!fire) continue
    if (fire > horizonEnd) continue
    candidates.push({
      id: uuidToInt(r.id),
      reminderId: r.id,
      fireAt: fire,
      title: r.title,
      body: formatNotificationBody(r),
    })
  }

  candidates.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
  const toSchedule = candidates.slice(0, horizon)
  const winnerIds = new Set(toSchedule.map((c) => c.id))

  const toCancel = currentlyPending
    .filter((p) => !isTombstone(p.scheduleAt) && !winnerIds.has(p.id))
    .map((p) => p.id)

  return { toSchedule, toCancel }
}

export function countInOneHourWindow(
  reminders: SchedulableReminder[],
  fireAt: Date,
): number {
  const windowMs = 60 * 60 * 1000
  const start = fireAt.getTime() - windowMs / 2
  const end = fireAt.getTime() + windowMs / 2
  let count = 0
  for (const r of reminders) {
    const t = nextOccurrenceAt(r, new Date(start - 1))
    if (t && t.getTime() >= start && t.getTime() <= end) count++
  }
  return count
}

export const SCHEDULE_HORIZON = DEFAULT_HORIZON
export const SCHEDULE_DAYS_AHEAD = DEFAULT_DAYS_AHEAD
