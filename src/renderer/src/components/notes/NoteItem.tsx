import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Note } from '../../types/models'
import MarkdownView from '../ui/MarkdownView'

interface Props {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export default function NoteItem({ note, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  const hasContent = note.content.trim().length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group mx-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 btn-3d"
    >
      {/* Main row */}
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical size={20} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <span
            className={`flex-1 text-[13px] leading-5 break-words min-w-0 text-slate-700 dark:text-white/75`}
          >
            {note.title || 'Untitled'}
          </span>
          {hasContent && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
            aria-label="Edit"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-red-500 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div className="pl-9 pr-3 pb-2">
          <MarkdownView content={note.content} />
        </div>
      )}
    </div>
  )
}
