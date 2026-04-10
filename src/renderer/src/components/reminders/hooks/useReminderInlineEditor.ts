import { useState } from 'react'
import type { Reminder, RecurrenceRule } from '../../../types/models'

const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: 'weekly',
  interval: 1,
}

interface Params {
  reminder: Reminder
  onSave: (r: Reminder) => Promise<void>
}

export function useReminderInlineEditor({ reminder, onSave }: Params) {
  const [title, setTitle] = useState(reminder.title)
  const [description, setDescription] = useState(reminder.description ?? '')
  const [reminderDate, setReminderDate] = useState(reminder.date)
  const [endDate, setEndDate] = useState(reminder.endDate ?? '')
  const [startTime, setStartTime] = useState(reminder.startTime ?? '')
  const [endTime, setEndTime] = useState(reminder.endTime ?? '')
  const [recurring, setRecurring] = useState(!!reminder.recurrence)
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    reminder.recurrence ?? DEFAULT_RECURRENCE
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isMultiDay = !!endDate && endDate !== reminderDate

  function handleDateChange(val: string) {
    setReminderDate(val)
    if (endDate && endDate < val) setEndDate('')
  }

  function handleEndDateChange(val: string) {
    setEndDate(val)
    if (val && val !== reminderDate) {
      setStartTime('')
      setEndTime('')
    }
  }

  function handleStartTimeChange(val: string) {
    setStartTime(val)
    if (endTime && endTime < val) setEndTime('')
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...reminder,
        title: title.trim(),
        description: description.trim() || undefined,
        date: reminderDate,
        endDate: endDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        recurrence: recurring ? recurrence : undefined,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    reminderDate,
    endDate,
    startTime,
    setStartTime,
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
  }
}
