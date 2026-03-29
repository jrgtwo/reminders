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
    opacity: isDragging ? 0.4 : 1,
  }

  const hasDescription = !!todo.description?.trim()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group mx-2 rounded-xl bg-white dark:bg-white/[0.04] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all"
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
            className={`flex-1 text-[13px] leading-5 break-words min-w-0 ${
              todo.completed
                ? 'line-through text-slate-300 dark:text-slate-500'
                : 'text-slate-700 dark:text-white/75'
            }`}
          >
            {todo.title}
          </span>
          {hasDescription && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 shrink-0 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
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
            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
            aria-label="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && hasDescription && (
        <div className="pl-10 pr-3 pb-2.5">
          <MarkdownView content={todo.description!} />
        </div>
      )}
    </div>
  )
}
