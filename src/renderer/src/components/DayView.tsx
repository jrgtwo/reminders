import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../utils/dates'
import { getOccurrencesInRange } from '../utils/recurrence'
import { useRemindersStore } from '../store/reminders.store'
import { useUIStore } from '../store/ui.store'
import type { Reminder } from '../types/models'
import NoteEditor from './notes/NoteEditor'
import ReminderList from './reminders/ReminderList'
import ReminderForm from './reminders/ReminderForm'

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return { label: 'Today', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' }
  if (cmp < 0)
    return { label: 'Past', cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/30 border border-slate-200 dark:border-white/10' }
  return null
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

  const dayReminders = useMemo(
    () => reminders.filter((r) => getOccurrencesInRange(r, plainDate, plainDate).length > 0),
    [reminders, plainDate],
  )

  const { weekday, rest } = formatDayHeading(plainDate)
  const status = getDayStatus(plainDate)

  return (
    <div className="max-w-2xl mx-auto px-8 py-7">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 mb-6 transition-colors -ml-0.5"
      >
        <ArrowLeft size={14} />
        Calendar
      </button>

      {/* Heading */}
      <div className="mb-7">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            {weekday}
          </h1>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 dark:text-white/35 font-medium">{rest}</p>
      </div>

      {/* Note editor */}
      <NoteEditor date={dateStr} />

      {/* Reminders */}
      <ReminderList
        date={dateStr}
        reminders={dayReminders}
        onAdd={() => { setEditing(null); setFormOpen(true) }}
        onEdit={(r) => { setEditing(r); setFormOpen(true) }}
        onDelete={remove}
        onToggle={toggleComplete}
      />

      {formOpen && (
        <ReminderForm
          date={dateStr}
          reminder={editing}
          onSave={async (r) => { await save(r); setFormOpen(false) }}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
