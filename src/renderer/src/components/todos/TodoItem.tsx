import { AlignLeft, Check, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { TodoListItem } from '../../types/models'
import MarkdownView from '../ui/MarkdownView'
import { useTodoItem } from './hooks/useTodoItem'

interface Props {
  todo: TodoListItem
  onToggle: (t: TodoListItem) => void
  onEdit: (t: TodoListItem) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  isEditing?: boolean
  onSaveEdit: (item: TodoListItem, title: string) => void
  onCancelEdit: (item: TodoListItem) => void
  onSaveDesc: (item: TodoListItem, description: string) => void
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, onSaveDesc }: Props) {
  const {
    expanded,
    editingDesc,
    draftDesc,
    setDraftDesc,
    draftTitle,
    setDraftTitle,
    hasDescription,
    attributes,
    listeners,
    setNodeRef,
    style,
    commit,
    handleTitleKeyDown,
    toggleDescription,
    handleDescBlur,
    handleDescKeyDown,
    startEditingDesc,
  } = useTodoItem({ todo, isEditing, onSaveEdit, onCancelEdit, onSaveDesc })

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

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo)}
          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
            todo.completed
              ? 'bg-[var(--accent)] border-[var(--accent)]'
              : 'border-slate-300 dark:border-white/20 hover:border-[var(--accent)]'
          }`}
          aria-label="Toggle complete"
        >
          {todo.completed && <Check size={20} className="text-[#f0f0f0]" strokeWidth={3} />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {isEditing ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={commit}
              placeholder="Item title"
              className="flex-1 min-w-0 bg-transparent text-[13px] leading-5 text-slate-700 dark:text-white/75 placeholder:text-slate-300 dark:placeholder:text-white/50 focus:outline-none"
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
              onClick={toggleDescription}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                hasDescription || expanded
                  ? 'text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/60'
                  : 'text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60'
              }`}
              aria-label={expanded ? 'Collapse description' : 'Edit description'}
            >
              <AlignLeft size={20} />
            </button>
            <button
              onClick={() => onEdit(todo)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              aria-label="Edit title"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={(e) => onDelete(todo.id, e)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-white/50 hover:text-red-500 transition-colors"
              aria-label="Delete"
            >
              <Trash2 size={20} />
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
              onBlur={handleDescBlur}
              onKeyDown={handleDescKeyDown}
              placeholder="Add a description…"
              rows={3}
              className="w-full bg-transparent text-[12px] leading-5 text-slate-600 dark:text-white/60 placeholder:text-slate-300 dark:placeholder:text-white/50 focus:outline-none resize-none"
            />
          ) : hasDescription ? (
            <div onClick={startEditingDesc} className="cursor-text">
              <MarkdownView content={todo.description!} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
