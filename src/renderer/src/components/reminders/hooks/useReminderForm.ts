import { useState } from 'react'
import type { Reminder, RecurrenceRule } from '../../../types/models'

const DEFAULT_RECURRENCE: RecurrenceRule = {
  frequency: 'weekly',
  interval: 1,
}

interface Params {
  date: string
  reminder: Reminder | null
  defaultTime?: string
  onSave: (r: Reminder) => Promise<void>
}

export function useReminderForm({ date, reminder, defaultTime, onSave }: Params) {
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
    reminder?.recurrence ?? DEFAULT_RECURRENCE
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  return {
    isNew,
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
    handleSubmit,
  }
}
