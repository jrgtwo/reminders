import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Todo } from '../../types/models'
import MarkdownView from '../ui/MarkdownView'

interface Props {
  todo: Todo
  onToggle: (t: Todo) => void
  onEdit: (t: Todo) => void
  onDelete: (id: string) => void
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasDescription = !!todo.description?.trim()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60"
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-2 py-1.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
          className="mt-0.5 w-4 h-4 rounded accent-blue-600 shrink-0 cursor-pointer"
        />

        {/* Title + expand toggle */}
        <div className="flex-1 min-w-0 flex items-start gap-1">
          <span
            className={`flex-1 text-sm leading-5 break-words min-w-0 ${
              todo.completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {todo.title}
          </span>
          {hasDescription && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(todo)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 rounded text-gray-400 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && hasDescription && (
        <div className="pl-10 pr-3 pb-2">
          <MarkdownView content={todo.description!} />
        </div>
      )}
    </div>
  )
}
