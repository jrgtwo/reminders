import { RefreshCw } from 'lucide-react'
import type { Reminder } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'
import RecurrenceEditor from './RecurrenceEditor'
import { useReminderForm } from './hooks/useReminderForm'

interface Props {
  date: string
  reminder: Reminder | null
  defaultTime?: string
  onSave: (r: Reminder) => Promise<void>
  onClose: () => void
}

export default function ReminderForm({ date, reminder, defaultTime, onSave, onClose }: Props) {
  const {
    isNew,
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
    handleSubmit,
  } = useReminderForm({ date, reminder, defaultTime, onSave })

  return (
    <Dialog title={isNew ? 'New Reminder' : 'Edit Reminder'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError('') }}
          placeholder="Reminder title"
          autoFocus
          error={error}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
            className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#6498c8] focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={reminderDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          <Input
            label="End Date (optional)"
            type="date"
            value={endDate}
            min={reminderDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
          />
        </div>

        {!isMultiDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time (optional)"
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
            />
            <Input
              label="End Time (optional)"
              type="time"
              value={endTime}
              min={startTime || undefined}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}

        {/* Recurrence toggle */}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Repeat</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={recurring}
            onClick={() => setRecurring(!recurring)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#6498c8] focus:ring-offset-1 dark:focus:ring-offset-[var(--bg-surface)] ${
              recurring ? 'bg-blue-500 dark:bg-[#6498c8]' : 'bg-gray-200 dark:bg-[var(--bg-elevated)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                recurring ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {recurring && (
          <div className="pl-4 border-l-2 border-[var(--border)]">
            <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Reminder' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
