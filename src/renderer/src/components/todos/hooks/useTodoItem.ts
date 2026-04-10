import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TodoListItem } from '../../../types/models'

interface Params {
  todo: TodoListItem
  isEditing: boolean | undefined
  onSaveEdit: (item: TodoListItem, title: string) => void
  onCancelEdit: (item: TodoListItem) => void
  onSaveDesc: (item: TodoListItem, description: string) => void
}

export function useTodoItem({ todo, isEditing, onSaveEdit, onCancelEdit, onSaveDesc }: Params) {
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

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  function toggleDescription() {
    if (expanded) {
      setExpanded(false)
      setEditingDesc(false)
    } else {
      setDraftDesc(todo.description ?? '')
      setEditingDesc(true)
      setExpanded(true)
    }
  }

  function handleDescBlur() {
    onSaveDesc(todo, draftDesc)
    setEditingDesc(false)
  }

  function handleDescKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingDesc(false)
      setDraftDesc(todo.description ?? '')
    }
  }

  function startEditingDesc() {
    setDraftDesc(todo.description ?? '')
    setEditingDesc(true)
  }

  useEffect(() => {
    if (isEditing) {
      setDraftTitle(todo.title)
      committedRef.current = false
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
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
  }
}
