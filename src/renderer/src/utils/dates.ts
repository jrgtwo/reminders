import { Temporal } from '@js-temporal/polyfill'

export { Temporal }

export function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO()
}

export function parseDateStr(s: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(s)
}

export function toDateStr(date: Temporal.PlainDate): string {
  return date.toString()
}

export function formatDayNum(date: Temporal.PlainDate): string {
  return String(date.day)
}

export function formatMonthYear(date: Temporal.PlainDate): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function formatWeekRange(days: Temporal.PlainDate[]): string {
  if (days.length === 0) return ''
  const first = days[0]
  const last = days[days.length - 1]
  if (first.month === last.month) {
    const month = first.toLocaleString('en-US', { month: 'long' })
    return `${month} ${first.day} \u2013 ${last.day}, ${first.year}`
  }
  const fmt = (d: Temporal.PlainDate) =>
    d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(first)} \u2013 ${fmt(last)}, ${last.year}`
}

export function isToday(date: Temporal.PlainDate): boolean {
  return date.equals(today())
}

export function isSameDay(a: Temporal.PlainDate, b: Temporal.PlainDate): boolean {
  return a.equals(b)
}

export function isSameMonth(a: Temporal.PlainDate, b: Temporal.PlainDate): boolean {
  return a.year === b.year && a.month === b.month
}

export function addMonths(date: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return date.add({ months: n })
}

export function subMonths(date: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return date.subtract({ months: n })
}

export function addWeeks(date: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return date.add({ weeks: n })
}

export function subWeeks(date: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return date.subtract({ weeks: n })
}

// Sunday-first week grid for month view (42 cells max)
// Temporal dayOfWeek: 1=Mon ... 7=Sun
// Days to back up to Sunday: dayOfWeek % 7 (7%7=0 for Sun, 1%7=1 for Mon, ..., 6%7=6 for Sat)
export function getMonthGrid(date: Temporal.PlainDate): Temporal.PlainDate[] {
  const firstOfMonth = date.with({ day: 1 })
  const gridStart = firstOfMonth.subtract({ days: firstOfMonth.dayOfWeek % 7 })
  const days: Temporal.PlainDate[] = []
  let cur = gridStart
  // Always 6 rows (42 days) so the grid is consistent regardless of month length
  while (days.length < 42) {
    days.push(cur)
    cur = cur.add({ days: 1 })
  }
  return days
}

// Format a "HH:MM" time string as either 12h or 24h
export function formatTime(time: string, format: '12h' | '24h'): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  if (format === '24h') return `${String(h).padStart(2, '0')}:${m}`
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${period}`
}

export function getWeekDays(date: Temporal.PlainDate): Temporal.PlainDate[] {
  const weekStart = date.subtract({ days: date.dayOfWeek % 7 })
  return Array.from({ length: 7 }, (_, i) => weekStart.add({ days: i }))
}
