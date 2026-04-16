import { useState, useRef, useEffect } from 'react'
import { AlarmClockPlus, Bell, Check, Clock, Edit2, RefreshCw, Trash2 } from 'lucide-react'
import type { Reminder } from '../../types/models'
import { useUIStore } from '../../store/ui.store'
import { formatTime } from '../../utils/dates'
import { getSnoozeDuration } from '../settings/NotificationsSection'

const SNOOZE_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
]

interface Props {
  reminder: Reminder
  date: string
  onToggle: (id: string, date: string) => void
  onEdit: (r: Reminder) => void
  onDelete: (id: string) => void
  onSnooze?: (id: string, date: string, minutes: number) => void
}

export default function ReminderItem({ reminder, date, onToggle, onEdit, onDelete, onSnooze }: Props) {
  const isCompleted = reminder.completedDates.includes(date)
  const timeFormat = useUIStore((s) => s.timeFormat)
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false)
  const snoozeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSnoozeMenu) return
    const handleClick = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSnoozeMenu])

  const handleSnooze = (minutes: number) => {
    setShowSnoozeMenu(false)
    if (onSnooze) {
      onSnooze(reminder.id, date, minutes)
    } else {
      // Fallback: use electronAPI directly if available
      const api = (window as any).electronAPI
      if (api?.snooze?.set) {
        api.snooze.set(reminder.id, date, minutes)
      }
    }
  }

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 group rounded-xl border border-slate-200/80 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] bg-white dark:bg-white/[0.03] transition-all ${
        isCompleted ? 'opacity-40' : ''
      } hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:shadow-sm dark:hover:shadow-none dark:hover:brightness-125 dark:hover:border-white/25`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(reminder.id, date)}
        className={`mt-[3px] w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-[#f0f0f0]'
            : 'border-slate-300 dark:border-white/20 hover:border-emerald-400 dark:hover:border-emerald-400'
        }`}
      >
        {isCompleted && <Check size={20} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            isCompleted
              ? 'line-through text-slate-300 dark:text-white/50'
              : 'text-slate-800 dark:text-white/80 font-medium'
          }`}
        >
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-slate-400 dark:text-white/55 mt-0.5 leading-snug">
            {reminder.description}
          </p>
        )}
        {(reminder.startTime || reminder.recurrence) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {reminder.startTime && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-upcoming)] bg-[var(--color-upcoming-muted)] border border-[var(--color-upcoming)]/20 border-b-[2px] border-b-[var(--color-upcoming)]/30 px-1.5 py-0.5 rounded-md">
                <Clock size={20} />
                {formatTime(reminder.startTime, timeFormat)}{reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}
              </span>
            )}
            {reminder.notifyBefore != null && reminder.notifyBefore > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-400/10 border border-violet-200/60 dark:border-violet-400/15 border-b-[2px] border-b-violet-200 dark:border-b-violet-400/25 px-1.5 py-0.5 rounded-md">
                <Bell size={20} />
              </span>
            )}
            {reminder.recurrence && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/15 border-b-[2px] border-b-amber-200 dark:border-b-amber-400/25 px-1.5 py-0.5 rounded-md">
                <RefreshCw size={20} />
                {reminder.recurrence.frequency}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {reminder.startTime && !isCompleted && (
          <div className="relative" ref={snoozeRef}>
            <button
              onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
              title="Snooze"
            >
              <AlarmClockPlus size={20} />
            </button>
            {showSnoozeMenu && (
              <div className="absolute right-0 top-7 z-50 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg py-1 min-w-[120px]">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">
                  Snooze for
                </div>
                {SNOOZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSnooze(opt.value)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                  <button
                    onClick={() => handleSnooze(getSnoozeDuration())}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Default ({getSnoozeDuration()} min)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => onEdit(reminder)}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
        >
          <Edit2 size={20} />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  )
}
