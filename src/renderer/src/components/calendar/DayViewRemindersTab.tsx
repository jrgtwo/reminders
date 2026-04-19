import type { Reminder } from '../../types/models'
import type { TimeFormat } from '../../store/ui.store'
import ReminderCard from '../reminders/ReminderCard'

export default function DayViewRemindersTab({
  dateStr,
  dayReminders,
  expandedReminderId,
  setExpandedReminderId,
  timeFormat,
  toggleComplete,
  save,
  handleAddReminder,
  handleCancelReminder,
  handleDeleteReminder,
}: {
  dateStr: string
  dayReminders: Reminder[]
  expandedReminderId: string | null
  setExpandedReminderId: (id: string | null) => void
  timeFormat: TimeFormat
  toggleComplete: (id: string, date: string) => void
  save: (r: Reminder) => Promise<void>
  handleAddReminder: () => void
  handleCancelReminder: (r: Reminder) => void
  handleDeleteReminder: (id: string, e: React.MouseEvent) => void
}) {
  const uncompleted = dayReminders.filter((r) => !r.completedDates.includes(dateStr))
  const completed = dayReminders.filter((r) => r.completedDates.includes(dateStr))
  const sortByTime = (a: Reminder, b: Reminder) => {
    if (a.startTime && b.startTime) return a.startTime < b.startTime ? -1 : 1
    if (a.startTime) return -1
    if (b.startTime) return 1
    return 0
  }
  const sortedUncompleted = uncompleted.sort(sortByTime)
  const sortedCompleted = completed.sort(sortByTime)

  if (dayReminders.length === 0) {
    return (
      <div className="mb-8 flex flex-col gap-2">
        <div className="min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-[13px] text-slate-400 dark:text-white/50 mb-4">
                No reminders for this day yet.
              </p>
              <button
                onClick={handleAddReminder}
                className="text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                + Add your first reminder
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderReminder(reminder: Reminder) {
    const isExpanded = expandedReminderId === reminder.id
    return (
      <ReminderCard
        key={reminder.id}
        reminder={reminder}
        dateStr={dateStr}
        isExpanded={isExpanded}
        onToggleExpand={() => setExpandedReminderId(isExpanded ? null : reminder.id)}
        timeFormat={timeFormat}
        toggleComplete={toggleComplete}
        onSave={async (r) => { await save(r); setExpandedReminderId(null) }}
        onCancel={() => handleCancelReminder(reminder)}
        onDelete={(e) => handleDeleteReminder(reminder.id, e)}
      />
    )
  }

  return (
    <div className="mb-8 flex flex-col gap-2">
      <button
        onClick={handleAddReminder}
        className="flex items-center gap-1.5 self-end text-[12px] font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity px-2 py-1 rounded-lg hover:bg-[var(--accent)]/[0.06]"
      >
        <span className="text-sm leading-none">+</span>
        Add Reminder
      </button>
      {sortedUncompleted.map((r) => renderReminder(r))}
      {sortedCompleted.length > 0 && (
        <>
          <div className="border-t border-slate-200 dark:border-white/[0.07] mt-2 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/50 mb-2">
              Completed
            </p>
          </div>
          {sortedCompleted.map((r) => renderReminder(r))}
        </>
      )}
      <button
        onClick={handleAddReminder}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[var(--accent)] dark:hover:border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)] text-[13px] font-medium transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add reminder
      </button>
    </div>
  )
}
