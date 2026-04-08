import type { Reminder, RecurrenceRule, RecurrenceFrequency } from '../types/models'

// iCal BYDAY → internal byDay index (0=Sun … 6=Sat)
const BYDAY_TO_INDEX: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
}

const FREQ_TO_INTERNAL: Record<string, RecurrenceFrequency> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

// Unfold iCal content lines (CRLF followed by a whitespace char is a continuation)
function unfold(text: string): string {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

// Unescape iCal text values
function unescapeText(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// Parse a content line into { name, params, value }
function parseLine(line: string): { name: string; params: Record<string, string>; value: string } {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return { name: line, params: {}, value: '' }

  const namePart = line.slice(0, colonIdx)
  const value = line.slice(colonIdx + 1)

  const segments = namePart.split(';')
  const name = segments[0].toUpperCase()
  const params: Record<string, string> = {}
  for (let i = 1; i < segments.length; i++) {
    const [k, v] = segments[i].split('=')
    if (k && v) params[k.toUpperCase()] = v.toUpperCase()
  }
  return { name, params, value }
}

// Convert iCal date/datetime string to YYYY-MM-DD
function icalDateToYMD(value: string): string {
  const clean = value.replace('Z', '')
  const datePart = clean.slice(0, 8)
  return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
}

// Convert iCal datetime string to HH:MM, or undefined if all-day
function icalDateToTime(value: string, params: Record<string, string>): string | undefined {
  if (params['VALUE'] === 'DATE') return undefined
  if (value.length < 15) return undefined // no time component
  const timePart = value.slice(9, 15) // HHmmss after the T
  return `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`
}

function parseRRule(rruleStr: string): RecurrenceRule | undefined {
  const parts: Record<string, string> = {}
  for (const part of rruleStr.split(';')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k] = v
  }

  const freq = FREQ_TO_INTERNAL[parts['FREQ']]
  if (!freq) return undefined

  const interval = parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1
  const rule: RecurrenceRule = { frequency: freq, interval }

  if (parts['COUNT']) {
    rule.count = parseInt(parts['COUNT'], 10)
  } else if (parts['UNTIL']) {
    rule.endDate = icalDateToYMD(parts['UNTIL'])
  }

  if (parts['BYDAY']) {
    const days = parts['BYDAY'].split(',')
      .map((d) => BYDAY_TO_INDEX[d.replace(/[+-\d]/g, '')])
      .filter((d) => d !== undefined) as number[]
    if (days.length > 0) rule.byDay = days.sort((a, b) => a - b)
  }

  return rule
}

interface ParsedEvent {
  uid?: string
  summary?: string
  description?: string
  dtstart?: string
  dtstartParams?: Record<string, string>
  dtend?: string
  dtendParams?: Record<string, string>
  rrule?: string
  created?: string
  lastModified?: string
}

function parseVEvent(lines: string[]): ParsedEvent {
  const event: ParsedEvent = {}
  for (const line of lines) {
    const { name, params, value } = parseLine(line)
    switch (name) {
      case 'UID': event.uid = value; break
      case 'SUMMARY': event.summary = unescapeText(value); break
      case 'DESCRIPTION': event.description = unescapeText(value); break
      case 'DTSTART':
        event.dtstart = value
        event.dtstartParams = params
        break
      case 'DTEND':
        event.dtend = value
        event.dtendParams = params
        break
      case 'RRULE': event.rrule = value; break
      case 'CREATED': event.created = value; break
      case 'LAST-MODIFIED': event.lastModified = value; break
    }
  }
  return event
}

function icalDateTimeToIso(value: string): string {
  // YYYYMMDDTHHMMSSZ → ISO
  const clean = value.endsWith('Z') ? value : value + 'Z'
  const y = clean.slice(0, 4)
  const mo = clean.slice(4, 6)
  const d = clean.slice(6, 8)
  const h = clean.slice(9, 11)
  const mi = clean.slice(11, 13)
  const s = clean.slice(13, 15)
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`
}

export interface IcalImportResult {
  reminders: Reminder[]
  skipped: number
}

export function parseIcal(icsText: string): IcalImportResult {
  const unfolded = unfold(icsText)
  const lines = unfolded.split(/\r?\n/).filter((l) => l.trim())

  const reminders: Reminder[] = []
  let skipped = 0
  let inEvent = false
  let eventLines: string[] = []

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      eventLines = []
    } else if (line === 'END:VEVENT') {
      inEvent = false
      const event = parseVEvent(eventLines)

      if (!event.dtstart || !event.summary) {
        skipped++
        continue
      }

      const date = icalDateToYMD(event.dtstart)
      const startTime = icalDateToTime(event.dtstart, event.dtstartParams ?? {})

      let endDate: string | undefined
      let endTime: string | undefined
      if (event.dtend) {
        const rawEndDate = icalDateToYMD(event.dtend)
        endTime = icalDateToTime(event.dtend, event.dtendParams ?? {})
        // For all-day events DTEND is exclusive; if it's the next day, omit endDate
        if (!endTime && rawEndDate !== date) {
          // iCal all-day DTEND is the next day; subtract 1 day to get last day
          const d = new Date(rawEndDate + 'T00:00:00Z')
          d.setUTCDate(d.getUTCDate() - 1)
          const adjusted = d.toISOString().slice(0, 10)
          if (adjusted !== date) endDate = adjusted
        } else if (endTime && rawEndDate !== date) {
          endDate = rawEndDate
        }
      }

      const now = new Date().toISOString()
      const reminder: Reminder = {
        id: event.uid
          ? event.uid.replace('@remindertoday.com', '')
          : crypto.randomUUID(),
        title: event.summary,
        description: event.description,
        date,
        endDate,
        startTime,
        endTime,
        recurrence: event.rrule ? parseRRule(event.rrule) : undefined,
        completedDates: [],
        createdAt: event.created ? icalDateTimeToIso(event.created) : now,
        updatedAt: event.lastModified ? icalDateTimeToIso(event.lastModified) : now,
      }

      reminders.push(reminder)
    } else if (inEvent) {
      eventLines.push(line)
    }
  }

  return { reminders, skipped }
}
