import { RRule } from 'rrule'
import { Temporal } from '@js-temporal/polyfill'
import type { Reminder } from '../types/models'
import { parseDateStr } from './dates'

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const

// byDay values in RecurrenceRule are 0-6 (Sun-Sat), matching RRule's index order
const WEEKDAYS = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]

function toUTC(date: Temporal.PlainDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day))
}

function fromUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Cache RRule instances keyed by reminder id + recurrence fingerprint so we
// don't pay the construction cost on every useMemo recomputation.
const rruleCache = new Map<string, RRule>()

function getRRule(reminder: Reminder): RRule {
  const r = reminder.recurrence!
  const key = `${reminder.id}|${reminder.date}|${r.frequency}|${r.interval}|${r.endDate ?? ''}|${r.count ?? ''}|${r.byDay?.join(',') ?? ''}`
  let rule = rruleCache.get(key)
  if (!rule) {
    const baseDate = parseDateStr(reminder.date)
    rule = new RRule({
      freq: FREQ_MAP[r.frequency],
      interval: r.interval,
      dtstart: toUTC(baseDate),
      until: r.endDate ? toUTC(parseDateStr(r.endDate)) : undefined,
      count: r.count,
      byweekday: r.byDay ? r.byDay.map((d) => WEEKDAYS[d]) : undefined,
    })
    rruleCache.set(key, rule)
  }
  return rule
}

export function getOccurrencesInRange(
  reminder: Reminder,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
): string[] {
  const baseDate = parseDateStr(reminder.date)

  if (!reminder.recurrence) {
    const cmpStart = Temporal.PlainDate.compare(baseDate, start)
    const cmpEnd = Temporal.PlainDate.compare(baseDate, end)
    return cmpStart >= 0 && cmpEnd <= 0 ? [reminder.date] : []
  }

  return getRRule(reminder).between(toUTC(start), toUTC(end), true).map(fromUTC)
}
