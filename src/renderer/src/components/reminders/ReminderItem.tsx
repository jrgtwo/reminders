import { Check, Clock, Edit2, RefreshCw, Trash2 } from 'lucide-react'
import type { Reminder } from '../../types/models'
import { useUIStore } from '../../store/ui.store'
import { formatTime } from '../../utils/dates'

interface Props {
  reminder: Reminder
  date: string
  onToggle: (id: string, date: string) => void
  onEdit: (r: Reminder) => void
  onDelete: (id: string) => void
}

export default function ReminderItem({ reminder, date, onToggle, onEdit, onDelete }: Props) {
  const isCompleted = reminder.completedDates.includes(date)
  const timeFormat = useUIStore((s) => s.timeFormat)

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 group rounded-xl transition-all ${
        isCompleted ? 'opacity-40' : ''
      } hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}
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
        {isCompleted && <Check size={9} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            isCompleted
              ? 'line-through text-slate-300 dark:text-white/20'
              : 'text-slate-800 dark:text-white/80 font-medium'
          }`}
        >
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5 leading-snug">
            {reminder.description}
          </p>
        )}
        {(reminder.startTime || reminder.recurrence) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {reminder.startTime && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                <Clock size={9} />
                {formatTime(reminder.startTime, timeFormat)}{reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}
              </span>
            )}
            {reminder.recurrence && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">
                <RefreshCw size={9} />
                {reminder.recurrence.frequency}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <button
          onClick={() => onEdit(reminder)}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
