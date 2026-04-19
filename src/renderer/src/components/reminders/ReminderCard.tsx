import { ArrowRight, Trash2, Check, Clock, RefreshCw } from 'lucide-react'
import { formatTime } from '../../utils/dates'
import type { Reminder } from '../../types/models'
import type { TimeFormat } from '../../store/ui.store'
import ReminderInlineEditor from './ReminderInlineEditor'

interface Props {
  reminder: Reminder
  dateStr: string
  isExpanded: boolean
  onToggleExpand: () => void
  timeFormat: TimeFormat
  toggleComplete?: (id: string, date: string) => void
  onSave: (r: Reminder) => Promise<void>
  onCancel: () => void
  onDelete: (e: React.MouseEvent) => void
  inModal?: boolean
}

export default function ReminderCard({
  reminder,
  dateStr,
  isExpanded,
  onToggleExpand,
  timeFormat,
  toggleComplete,
  onSave,
  onCancel,
  onDelete,
  inModal,
}: Props) {
  const isCompleted = reminder.completedDates.includes(dateStr)

  return (
    <div
      className={`bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] rounded-xl shadow-sm ${inModal ? 'flex flex-col flex-1 min-h-0' : 'hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 btn-3d'} ${isCompleted ? 'opacity-60' : ''}`}
    >
      <button
        onClick={onToggleExpand}
        className={`flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-slate-50/50 dark:hover:bg-white/[0.04] group ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        {toggleComplete && (
          <span
            onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id, dateStr) }}
            role="checkbox"
            aria-checked={isCompleted}
            className={`mt-[3px] w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-[#f0f0f0]'
                : 'border-slate-300 dark:border-white/20 hover:border-emerald-400 dark:hover:border-emerald-400'
            }`}
          >
            {isCompleted && <Check size={20} strokeWidth={3} />}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[14px] font-medium leading-snug ${isCompleted ? 'line-through text-slate-300 dark:text-white/50' : 'text-slate-800 dark:text-white/80'}`}
          >
            {reminder.title || (
              <span className="italic text-slate-400 dark:text-white/55">Untitled</span>
            )}
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
                  {formatTime(reminder.startTime, timeFormat)}
                  {reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}
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
        <ArrowRight
          size={20}
          className={`shrink-0 text-slate-300 dark:text-white/50 transition-transform mt-1 ${isExpanded ? 'rotate-90' : ''}`}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(e) }}
          className="w-8 h-8 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete reminder"
        >
          <Trash2 size={20} />
        </button>
      </button>
      {isExpanded && (
        inModal ? (
          <div className="overflow-y-auto flex-1 min-h-0">
            <ReminderInlineEditor
              reminder={reminder}
              onSave={onSave}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          </div>
        ) : (
          <ReminderInlineEditor
            reminder={reminder}
            onSave={onSave}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  )
}
