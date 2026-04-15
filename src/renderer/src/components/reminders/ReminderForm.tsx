import { Bell, RefreshCw } from 'lucide-react'
import type { Reminder } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'
import RichTextDescription from '../ui/RichTextDescription'
import Toggle from '../ui/Toggle'
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
    notifyBefore,
    setNotifyBefore,
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
          <RichTextDescription
            value={description}
            onChange={setDescription}
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

        {/* Notify before — only shown when a start time is set */}
        {startTime && !isMultiDay && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remind me</span>
            </div>
            <select
              value={notifyBefore ?? ''}
              onChange={(e) => setNotifyBefore(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)] [&>option]:bg-white [&>option]:dark:bg-[var(--bg-elevated)] [&>option]:text-gray-900 [&>option]:dark:text-gray-100"
            >
              <option value="">At time of event</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="120">2 hours before</option>
              <option value="1440">1 day before</option>
              <option value="2880">2 days before</option>
            </select>
          </div>
        )}

        {/* Recurrence toggle */}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Repeat</span>
          </div>
          <Toggle checked={recurring} onChange={setRecurring} />
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
          <Button type="submit" variant="accent" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Reminder' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
