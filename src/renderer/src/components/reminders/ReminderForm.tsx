import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Reminder, RecurrenceRule } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'
import RecurrenceEditor from './RecurrenceEditor'

const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: 'weekly',
  interval: 1,
}

interface Props {
  date: string
  reminder: Reminder | null
  defaultTime?: string
  onSave: (r: Reminder) => Promise<void>
  onClose: () => void
}

export default function ReminderForm({ date, reminder, defaultTime, onSave, onClose }: Props) {
  const isNew = !reminder
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [description, setDescription] = useState(reminder?.description ?? '')
  const [reminderDate, setReminderDate] = useState(reminder?.date ?? date)
  const [endDate, setEndDate] = useState(reminder?.endDate ?? '')
  const [startTime, setStartTime] = useState(reminder?.startTime ?? defaultTime ?? '')
  const [endTime, setEndTime] = useState(reminder?.endTime ?? '')
  const isMultiDay = !!endDate && endDate !== reminderDate
  const [recurring, setRecurring] = useState(!!reminder?.recurrence)
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    reminder?.recurrence ?? DEFAULT_RECURRENCE,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    const now = new Date().toISOString()
    const r: Reminder = {
      id: reminder?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      date: reminderDate,
      startTime: startTime || undefined,
      endDate: endDate || undefined,
      endTime: endTime || undefined,
      recurrence: recurring ? recurrence : undefined,
      completedDates: reminder?.completedDates ?? [],
      createdAt: reminder?.createdAt ?? now,
      updatedAt: now,
    }

    try {
      await onSave(r)
    } catch {
      setError('Failed to save reminder')
      setSaving(false)
    }
  }

  return (
    <Dialog title={isNew ? 'New Reminder' : 'Edit Reminder'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
          placeholder="Reminder title"
          autoFocus
          error={error}
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={reminderDate}
            onChange={(e) => {
              const val = e.target.value
              setReminderDate(val)
              if (endDate && endDate < val) setEndDate('')
            }}
          />
          <Input
            label="End Date (optional)"
            type="date"
            value={endDate}
            min={reminderDate}
            onChange={(e) => {
              const val = e.target.value
              setEndDate(val)
              if (val && val !== reminderDate) {
                setStartTime('')
                setEndTime('')
              }
            }}
          />
        </div>

        {!isMultiDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time (optional)"
              type="time"
              value={startTime}
              onChange={(e) => {
                const val = e.target.value
                setStartTime(val)
                if (endTime && endTime < val) setEndTime('')
              }}
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
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <RefreshCw size={14} className="text-gray-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Repeat</span>
        </label>

        {recurring && (
          <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
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
