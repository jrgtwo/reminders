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

  const { frequency, interval, endDate, count, byDay } = reminder.recurrence

  const rule = new RRule({
    freq: FREQ_MAP[frequency],
    interval,
    dtstart: toUTC(baseDate),
    until: endDate ? toUTC(parseDateStr(endDate)) : undefined,
    count,
    byweekday: byDay ? byDay.map((d) => WEEKDAYS[d]) : undefined,
  })

  return rule.between(toUTC(start), toUTC(end), true).map(fromUTC)
}
