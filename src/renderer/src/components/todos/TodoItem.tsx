import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, Check, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { TodoListItem } from '../../types/models'
import MarkdownView from '../ui/MarkdownView'

interface Props {
  todo: TodoListItem
  onToggle: (t: TodoListItem) => void
  onEdit: (t: TodoListItem) => void
  onDelete: (id: string) => void
  isEditing?: boolean
  onSaveEdit: (item: TodoListItem, title: string) => void
  onCancelEdit: (item: TodoListItem) => void
  onSaveDesc: (item: TodoListItem, description: string) => void
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, onSaveDesc }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [draftDesc, setDraftDesc] = useState(todo.description ?? '')
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const committedRef = useRef(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const hasDescription = !!todo.description?.trim()

  function commit() {
    if (committedRef.current) return
    committedRef.current = true
    onSaveEdit(todo, draftTitle)
  }

  function cancel() {
    if (committedRef.current) return
    committedRef.current = true
    onCancelEdit(todo)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  // Sync draft title and reset committed flag when editing starts
  useEffect(() => {
    if (isEditing) {
      setDraftTitle(todo.title)
      committedRef.current = false
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group mx-2 rounded-xl bg-white dark:bg-white/[0.04] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all"
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
          <GripVertical size={12} />
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo)}
          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
            todo.completed
              ? 'bg-blue-500 border-blue-500 dark:bg-[#6498c8] dark:border-[#6498c8]'
              : 'border-slate-300 dark:border-white/20 hover:border-blue-400 dark:hover:border-[#6498c8]/60'
          }`}
          aria-label="Toggle complete"
        >
          {todo.completed && <Check size={8} className="text-[#f0f0f0]" strokeWidth={3} />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {isEditing ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commit}
              placeholder="Item title"
              className="flex-1 min-w-0 bg-transparent text-[13px] leading-5 text-slate-700 dark:text-white/75 placeholder:text-slate-300 dark:placeholder:text-white/25 focus:outline-none"
            />
          ) : (
            <>
              <span
                className={`flex-1 text-[13px] leading-5 break-words min-w-0 ${
                  todo.completed
                    ? 'line-through text-slate-300 dark:text-slate-500'
                    : 'text-slate-700 dark:text-white/75'
                }`}
              >
                {todo.title}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => {
                if (expanded) {
                  setExpanded(false)
                  setEditingDesc(false)
                } else {
                  setDraftDesc(todo.description ?? '')
                  setEditingDesc(true)
                  setExpanded(true)
                }
              }}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                hasDescription || expanded
                  ? 'text-slate-400 dark:text-white/35 hover:text-slate-600 dark:hover:text-white/60'
                  : 'text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60'
              }`}
              aria-label={expanded ? 'Collapse description' : 'Edit description'}
            >
              <AlignLeft size={12} />
            </button>
            <button
              onClick={() => onEdit(todo)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              aria-label="Edit title"
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
        )}
      </div>

      {/* Description */}
      {expanded && (
        <div className="pl-9 pr-3 pb-2">
          {editingDesc ? (
            <textarea
              autoFocus
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              onBlur={() => {
                onSaveDesc(todo, draftDesc)
                setEditingDesc(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); setEditingDesc(false); setDraftDesc(todo.description ?? '') }
              }}
              placeholder="Add a description…"
              rows={3}
              className="w-full bg-transparent text-[12px] leading-5 text-slate-600 dark:text-white/60 placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none resize-none"
            />
          ) : hasDescription ? (
            <div onClick={() => { setDraftDesc(todo.description ?? ''); setEditingDesc(true) }} className="cursor-text">
              <MarkdownView content={todo.description!} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
