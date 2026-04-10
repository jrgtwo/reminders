import { useState } from 'react'
import type { TodoListItem } from '../../../types/models'

interface Params {
  item: TodoListItem | null
  listId: string
  onSave: (item: TodoListItem) => Promise<void>
}

export function useTodoForm({ item, listId, onSave }: Params) {
  const isNew = !item
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function clearError() {
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    const newItem: TodoListItem = {
      id: item?.id ?? crypto.randomUUID(),
      listId,
      title: title.trim(),
      description: description.trim() || undefined,
      order: item?.order ?? Date.now(),
      completed: item?.completed ?? false,
      completedAt: item?.completedAt,
      createdAt: item?.createdAt ?? now,
      updatedAt: now,
    }
    console.log('[TodoForm] About to save item:', newItem)
    try {
      await onSave(newItem)
      console.log('[TodoForm] Item saved successfully')
    } catch (err) {
      console.error('[TodoForm] Save failed:', err)
      setError('Failed to save')
      setSaving(false)
    }
  }

  return { isNew, title, setTitle, description, setDescription, saving, error, clearError, handleSubmit }
}
