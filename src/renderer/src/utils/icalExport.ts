import type { Reminder } from '../types/models'

// byDay internal encoding: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const BYDAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// iCal requires lines > 75 octets to be folded (CRLF + SPACE)
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = [line.slice(0, 75)]
  let pos = 75
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74))
    pos += 74
  }
  return chunks.join('\r\n')
}

function formatDate(date: string): string {
  return date.replace(/-/g, '')
}

function formatDateTime(date: string, time: string): string {
  const [h, m] = time.split(':')
  return `${formatDate(date)}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`
}

function formatIsoToIcal(iso: string): string {
  // ISO 8601 → YYYYMMDDTHHmmssZ
  return new Date(iso).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function buildRRule(recurrence: NonNullable<Reminder['recurrence']>): string {
  const parts: string[] = [`FREQ=${recurrence.frequency.toUpperCase()}`]
  if (recurrence.interval !== 1) {
    parts.push(`INTERVAL=${recurrence.interval}`)
  }
  if (recurrence.count != null) {
    parts.push(`COUNT=${recurrence.count}`)
  } else if (recurrence.endDate) {
    parts.push(`UNTIL=${formatDate(recurrence.endDate)}`)
  }
  if (recurrence.byDay && recurrence.byDay.length > 0) {
    parts.push(`BYDAY=${recurrence.byDay.map((d) => BYDAY_MAP[d]).join(',')}`)
  }
  return parts.join(';')
}

export function remindersToIcal(reminders: Reminder[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Reminder Today//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const r of reminders) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${r.id}@remindertoday.com`)

    if (r.startTime) {
      lines.push(`DTSTART:${formatDateTime(r.date, r.startTime)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${formatDate(r.date)}`)
    }

    const endDateStr = r.endDate ?? r.date
    if (r.endTime) {
      lines.push(`DTEND:${formatDateTime(endDateStr, r.endTime)}`)
    } else if (r.startTime) {
      // Timed event with no explicit end: default to 1 hour after start
      const [h, m] = r.startTime.split(':').map(Number)
      const endH = String(Math.min(h + 1, 23)).padStart(2, '0')
      const endM = String(m).padStart(2, '0')
      lines.push(`DTEND:${formatDateTime(r.date, `${endH}:${endM}`)}`)
    } else {
      // All-day: DTEND is exclusive next day per iCal spec
      lines.push(`DTEND;VALUE=DATE:${nextDay(endDateStr)}`)
    }

    lines.push(foldLine(`SUMMARY:${escapeText(r.title)}`))

    if (r.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(r.description)}`))
    }

    if (r.recurrence) {
      lines.push(`RRULE:${buildRRule(r.recurrence)}`)
    }

    lines.push(`CREATED:${formatIsoToIcal(r.createdAt)}`)
    lines.push(`LAST-MODIFIED:${formatIsoToIcal(r.updatedAt)}`)

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
