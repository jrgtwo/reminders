import { useNavigate } from 'react-router-dom'
import { Bell, Clock, Repeat, CalendarDays, ArrowRight, FileText } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import type { Reminder } from '../../types/models'
import Dialog from '../ui/Dialog'
import { useUIStore } from '../../store/ui.store'
import { formatTime } from '../../utils/dates'

function formatDate(dateStr: string): string {
  const d = Temporal.PlainDate.from(dateStr)
  return d.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatNotifyBefore(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60)
    return `${h} hour${h !== 1 ? 's' : ''}`
  }
  const d = Math.floor(minutes / 1440)
  return `${d} day${d !== 1 ? 's' : ''}`
}

function formatRecurrence(r: Reminder['recurrence']): string {
  if (!r) return ''
  const freq = r.interval === 1
    ? r.frequency
    : `every ${r.interval} ${r.frequency.replace(/ly$/, '')}s`
  const end = r.endDate
    ? ` until ${Temporal.PlainDate.from(r.endDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : r.count
    ? ` for ${r.count} occurrences`
    : ''
  return `Repeats ${freq}${end}`
}

interface Props {
  reminder: Reminder
  dateStr: string
  onClose: () => void
}

export default function ReminderDetail({ reminder, dateStr, onClose }: Props) {
  const navigate = useNavigate()
  const timeFormat = useUIStore((s) => s.timeFormat)

  function goToDay() {
    onClose()
    navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })
  }

  return (
    <Dialog title={reminder.title} onClose={onClose}>
      <div className="space-y-4">

        {/* Date + time */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CalendarDays size={20} className="shrink-0 text-[var(--accent)]" />
            <span>{formatDate(dateStr)}</span>
          </div>
          {reminder.startTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock size={20} className="shrink-0 text-[var(--accent)]" />
              <span>{formatTime(reminder.startTime, timeFormat)}{reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}</span>
            </div>
          )}
          {reminder.notifyBefore != null && reminder.notifyBefore > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Bell size={20} className="shrink-0 text-[var(--accent)]" />
              <span>{formatNotifyBefore(reminder.notifyBefore)} before</span>
            </div>
          )}
          {reminder.recurrence && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Repeat size={20} className="shrink-0 text-[var(--accent)]" />
              <span>{formatRecurrence(reminder.recurrence)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {reminder.description?.trim() && (
          <div className="flex gap-2">
            <FileText size={20} className="shrink-0 mt-0.5 text-gray-400 dark:text-white/55" />
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {reminder.description}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-white/[0.07]" />

        {/* Link to day */}
        <button
          onClick={goToDay}
          className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <span>View full day</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </Dialog>
  )
}
