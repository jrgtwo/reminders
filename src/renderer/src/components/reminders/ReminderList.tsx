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

export default function ReminderList({ date, reminders, onAdd, onEdit, onDelete, onToggle }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 dark:text-white/25">
          Reminders
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06]"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-[13px] text-slate-300 dark:text-white/20 py-8 text-center">
          No reminders for this day
        </p>
      ) : (
        <div className="flex flex-col -mx-4">
          {reminders.map((r) => (
            <ReminderItem
              key={r.id}
              reminder={r}
              date={date}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
