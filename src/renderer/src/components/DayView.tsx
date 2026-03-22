import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../utils/dates'
import { getOccurrencesInRange } from '../utils/recurrence'
import { useRemindersStore } from '../store/reminders.store'
import { useUIStore } from '../store/ui.store'
import type { Reminder } from '../types/models'
import Button from './ui/Button'
import NoteEditor from './notes/NoteEditor'
import ReminderList from './reminders/ReminderList'
import ReminderForm from './reminders/ReminderForm'

function formatDayHeading(date: Temporal.PlainDate): string {
  return date.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function DayView() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()

  const dateStr = date ?? today().toString()
  const plainDate = useMemo(() => parseDateStr(dateStr), [dateStr])

  const reminders = useRemindersStore((s) => s.reminders)
  const save = useRemindersStore((s) => s.save)
  const remove = useRemindersStore((s) => s.remove)
  const toggleComplete = useRemindersStore((s) => s.toggleComplete)

  const triggerNewReminder = useUIStore((s) => s.triggerNewReminder)
  const setTriggerNewReminder = useUIStore((s) => s.setTriggerNewReminder)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)

  useEffect(() => {
    if (!triggerNewReminder) return
    setTriggerNewReminder(false)
    setEditing(null)
    setFormOpen(true)
  }, [triggerNewReminder, setTriggerNewReminder])

  // Filter reminders that have an occurrence on this specific date
  const dayReminders = useMemo(
    () => reminders.filter((r) => getOccurrencesInRange(r, plainDate, plainDate).length > 0),
    [reminders, plainDate],
  )

  function handleAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(r: Reminder) {
    setEditing(r)
    setFormOpen(true)
  }

  async function handleSave(r: Reminder) {
    await save(r)
    setFormOpen(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-5">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft size={16} />
        Back
      </Button>

      {/* Date heading */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {formatDayHeading(plainDate)}
      </h1>

      {/* Note editor for this day */}
      <NoteEditor date={dateStr} />

      {/* Reminder list for this day */}
      <ReminderList
        date={dateStr}
        reminders={dayReminders}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={remove}
        onToggle={toggleComplete}
      />

      {/* Create / edit dialog */}
      {formOpen && (
        <ReminderForm
          date={dateStr}
          reminder={editing}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
