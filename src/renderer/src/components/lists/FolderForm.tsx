import { useState } from 'react'
import type { TodoFolder } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'

interface Props {
  folder: TodoFolder | null
  onSave: (f: TodoFolder) => Promise<void>
  onClose: () => void
}

export default function FolderForm({ folder, onSave, onClose }: Props) {
  const isNew = !folder
  const [name, setName] = useState(folder?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const now = new Date().toISOString()
    const f: TodoFolder = {
      id: folder?.id ?? crypto.randomUUID(),
      name: name.trim(),
      order: folder?.order ?? Date.now(),
      createdAt: folder?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      await onSave(f)
    } catch {
      setError('Failed to save folder')
      setSaving(false)
    }
  }

  return (
    <Dialog title={isNew ? 'New Folder' : 'Rename Folder'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Folder name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="e.g. Work, Personal"
          autoFocus
          error={error}
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create Folder' : 'Save'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
