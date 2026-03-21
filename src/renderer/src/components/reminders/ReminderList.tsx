import { Plus } from 'lucide-react'
import type { Reminder } from '../../types/models'
import Button from '../ui/Button'
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
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Reminders</h2>
        <Button size="sm" onClick={onAdd}>
          <Plus size={14} />
          Add
        </Button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
          No reminders for this day
        </p>
      ) : (
        <div className="flex flex-col">
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
