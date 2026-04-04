import { useState } from 'react'
import type { Todo } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'

interface Props {
  todo: Todo | null
  defaultDueDate?: string
  defaultListId?: string
  onSave: (t: Todo) => Promise<void>
  onClose: () => void
}

export default function TodoForm({ todo, defaultDueDate, defaultListId, onSave, onClose }: Props) {
  const isNew = !todo
  const [title, setTitle] = useState(todo?.title ?? '')
  const [description, setDescription] = useState(todo?.description ?? '')
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? defaultDueDate ?? '')
  const listId = todo?.listId ?? defaultListId
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    const t: Todo = {
      id: todo?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      listId,
      order: todo?.order ?? Date.now(),
      completed: todo?.completed ?? false,
      completedAt: todo?.completedAt,
      createdAt: todo?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      await onSave(t)
    } catch {
      setError('Failed to save todo')
      setSaving(false)
    }
  }

  return (
    <Dialog title={isNew ? 'New Todo' : 'Edit Todo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
          placeholder="What needs to be done?"
          autoFocus
          error={error}
        />

        <Input
          label="Due date (optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description{' '}
            <span className="font-normal text-gray-400 dark:text-gray-500">(optional — supports Markdown)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details... **bold**, _italic_, `code`, - lists"
            rows={4}
            className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Todo' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
