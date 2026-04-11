import { RefreshCw, Trash2 } from 'lucide-react'
import type { Reminder } from '../../types/models'
import RecurrenceEditor from './RecurrenceEditor'
import { useReminderInlineEditor } from './hooks/useReminderInlineEditor'

interface Props {
  reminder: Reminder
  onSave: (r: Reminder) => Promise<void>
  onCancel: () => void
  onDelete: (e: React.MouseEvent) => void
}

const fieldClass =
  'text-[13px] text-slate-700 dark:text-white/60 bg-transparent border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#6498c8] w-full'

const labelClass =
  'text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30'

export default function ReminderInlineEditor({ reminder, onSave, onCancel, onDelete }: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    reminderDate,
    endDate,
    startTime,
    endTime,
    setEndTime,
    isMultiDay,
    recurring,
    setRecurring,
    recurrence,
    setRecurrence,
    saving,
    error,
    setError,
    handleDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleSave,
  } = useReminderInlineEditor({ reminder, onSave })

  return (
    <div className="px-4 py-4 rounded-b-xl bg-white dark:bg-white/[0.06] border border-t-0 border-slate-200/60 dark:border-white/[0.08] flex flex-col gap-3">
      {/* Title */}
      <div>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError('') }}
          placeholder="Title"
          className="w-full text-[14px] font-medium text-slate-800 dark:text-white/80 placeholder:text-slate-300 dark:placeholder:text-white/20 bg-transparent border-b border-slate-200 dark:border-white/[0.08] pb-1.5 focus:outline-none focus:border-[#6498c8] transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onCancel()
          }}
        />
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="text-[13px] text-slate-500 dark:text-white/50 placeholder:text-slate-300 dark:placeholder:text-white/20 bg-transparent border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-[#6498c8] resize-none w-full transition-colors"
      />

      {/* Date row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            End Date <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={endDate}
            min={reminderDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Time row */}
      {!isMultiDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              Start Time <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              End Time <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={endTime}
              min={startTime || undefined}
              onChange={(e) => setEndTime(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {/* Repeat toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={20} className="text-slate-400 dark:text-white/30" />
          <span className="text-[13px] text-slate-600 dark:text-white/60">Repeat</span>
        </div>
        <button
          type="button"
          onClick={() => setRecurring(!recurring)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            recurring ? 'bg-[#6498c8]' : 'bg-slate-200 dark:bg-white/[0.1]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
              recurring ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {recurring && (
        <div className="pl-3 border-l-2 border-slate-200 dark:border-white/[0.08]">
          <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.05]">
        <button
          type="button"
          onClick={(e) => onDelete(e)}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
          Delete
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-[12px] font-medium text-white bg-[#6498c8] hover:bg-[#5387b7] disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
