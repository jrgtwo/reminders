import { useState } from 'react'
import type { TodoList } from '../../../types/models'

interface Params {
  list: TodoList | null
  defaultFolderId?: string
  defaultDueDate?: string
  onSave: (l: TodoList) => Promise<void>
}

export function useListForm({ list, defaultFolderId, defaultDueDate, onSave }: Params) {
  const isNew = !list
  const [name, setName] = useState(list?.name ?? '')
  const [dueDate, setDueDate] = useState(list?.dueDate ?? defaultDueDate ?? '')
  const [folderId, setFolderId] = useState(list?.folderId ?? defaultFolderId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleDueDateChange(val: string) {
    setDueDate(val)
    if (val) setFolderId('')
  }

  function handleFolderChange(val: string) {
    setFolderId(val)
    if (val) setDueDate('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    const l: TodoList = {
      id: list?.id ?? crypto.randomUUID(),
      name: name.trim(),
      folderId: folderId || undefined,
      dueDate: dueDate || undefined,
      order: list?.order ?? Date.now(),
      createdAt: list?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      await onSave(l)
    } catch {
      setError('Failed to save list')
      setSaving(false)
    }
  }

  return {
    isNew,
    name,
    setName,
    dueDate,
    folderId,
    saving,
    error,
    setError,
    handleDueDateChange,
    handleFolderChange,
    handleSubmit,
  }
}
