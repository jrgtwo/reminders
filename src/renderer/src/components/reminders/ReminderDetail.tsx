import { useNavigate } from 'react-router-dom'
import { Clock, Repeat, CalendarDays, ArrowRight, FileText } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import type { Reminder } from '../../types/models'
import Dialog from '../ui/Dialog'
import { useUIStore } from '../../store/ui.store'
import { formatTime } from '../../utils/dates'

function formatDate(dateStr: string): string {
  const d = Temporal.PlainDate.from(dateStr)
  return d.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
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
            <CalendarDays size={14} className="shrink-0 text-[#6498c8]" />
            <span>{formatDate(dateStr)}</span>
          </div>
          {reminder.startTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock size={14} className="shrink-0 text-[#6498c8]" />
              <span>{formatTime(reminder.startTime, timeFormat)}{reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}</span>
            </div>
          )}
          {reminder.recurrence && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Repeat size={14} className="shrink-0 text-[#6498c8]" />
              <span>{formatRecurrence(reminder.recurrence)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {reminder.description?.trim() && (
          <div className="flex gap-2">
            <FileText size={14} className="shrink-0 mt-0.5 text-gray-400 dark:text-white/30" />
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
          className="flex items-center gap-2 text-sm font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
        >
          <span>View full day</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </Dialog>
  )
}
