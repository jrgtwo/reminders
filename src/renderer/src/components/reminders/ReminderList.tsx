import { Plus } from 'lucide-react'
import type { Reminder } from '../../types/models'
import ReminderItem from './ReminderItem'

interface Props {
  date: string
  reminders: Reminder[]
  onAdd: () => void
  onEdit: (r: Reminder) => void
  onDelete: (id: string) => void
  onToggle: (id: string, date: string) => void
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 dark:text-white/50 px-4 mt-4 mb-1">
      {label}
    </p>
  )
}

export default function ReminderList({ date, reminders, onAdd, onEdit, onDelete, onToggle }: Props) {
  const allDay = reminders.filter((r) => !r.startTime)
  const timed = reminders
    .filter((r) => !!r.startTime)
    .sort((a, b) => (a.startTime! < b.startTime! ? -1 : a.startTime! > b.startTime! ? 1 : 0))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 dark:text-white/50">
          Reminders
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-white/55 hover:text-slate-700 dark:hover:text-white/60 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06]"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-[13px] text-slate-300 dark:text-white/50 py-8 text-center">
          No reminders for this day
        </p>
      ) : (
        <div className="flex flex-col -mx-4">
          {allDay.length > 0 && (
            <>
              <SectionHeader label="All Day" />
              {allDay.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  date={date}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </>
          )}
          {timed.length > 0 && (
            <>
              <SectionHeader label="Timed" />
              {timed.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  date={date}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
