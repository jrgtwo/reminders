import { Check, Clock, Edit2, RefreshCw, Trash2 } from 'lucide-react'
import type { Reminder } from '../../types/models'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface Props {
  reminder: Reminder
  date: string
  onToggle: (id: string, date: string) => void
  onEdit: (r: Reminder) => void
  onDelete: (id: string) => void
}

export default function ReminderItem({ reminder, date, onToggle, onEdit, onDelete }: Props) {
  const isCompleted = reminder.completedDates.includes(date)

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg group transition-colors ${
        isCompleted ? 'opacity-60' : ''
      } hover:bg-gray-50 dark:hover:bg-gray-800/60`}
    >
      {/* Completion toggle */}
      <button
        onClick={() => onToggle(reminder.id, date)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
        }`}
      >
        {isCompleted && <Check size={11} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            isCompleted
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {reminder.description}
          </p>
        )}
        {(reminder.time || reminder.recurrence) && (
          <div className="flex items-center gap-2 mt-1.5">
            {reminder.time && (
              <Badge variant="blue">
                <Clock size={10} className="mr-1" />
                {reminder.time}
              </Badge>
            )}
            {reminder.recurrence && (
              <Badge variant="orange">
                <RefreshCw size={10} className="mr-1" />
                {reminder.recurrence.frequency}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" onClick={() => onEdit(reminder)} className="p-1.5">
          <Edit2 size={13} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(reminder.id)}
          className="p-1.5 hover:text-red-500"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}
