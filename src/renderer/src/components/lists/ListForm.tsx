import type { TodoFolder, TodoList } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'
import { useListForm } from './hooks/useListForm'

interface Props {
  list: TodoList | null
  folders: TodoFolder[]
  defaultFolderId?: string
  defaultDueDate?: string // pre-fills the date for date-based lists
  onSave: (l: TodoList) => Promise<void>
  onClose: () => void
}

export default function ListForm({ list, folders, defaultFolderId, defaultDueDate, onSave, onClose }: Props) {
  const { isNew, name, setName, dueDate, folderId, saving, error, setError, handleDueDateChange, handleFolderChange, handleSubmit } =
    useListForm({ list, defaultFolderId, defaultDueDate, onSave })

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
              className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
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
