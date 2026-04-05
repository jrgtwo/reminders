import { useState } from 'react'
import type { TodoFolder, TodoList } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'

interface Props {
  list: TodoList | null
  folders: TodoFolder[]
  defaultFolderId?: string
  defaultDueDate?: string   // pre-fills the date for date-based lists
  onSave: (l: TodoList) => Promise<void>
  onClose: () => void
}

export default function ListForm({ list, folders, defaultFolderId, defaultDueDate, onSave, onClose }: Props) {
  const isNew = !list
  const [name, setName] = useState(list?.name ?? '')
  const [dueDate, setDueDate] = useState(list?.dueDate ?? defaultDueDate ?? '')
  const [folderId, setFolderId] = useState(list?.folderId ?? defaultFolderId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // dueDate and folderId are mutually exclusive
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
    if (!name.trim()) { setError('Name is required'); return }
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

  return (
    <Dialog title={isNew ? 'New List' : 'Edit List'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="List name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="e.g. Sprint Tasks, Groceries, Morning routine"
          autoFocus
          error={error}
        />

        <Input
          label="Date (optional — creates a date-based list)"
          type="date"
          value={dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
        />

        {!dueDate && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Folder <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={folderId}
              onChange={(e) => handleFolderChange(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create List' : 'Save'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
