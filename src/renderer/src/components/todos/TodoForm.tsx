import type { TodoListItem } from '../../types/models'
import Button from '../ui/Button'
import Dialog from '../ui/Dialog'
import Input from '../ui/Input'
import { useTodoForm } from './hooks/useTodoForm'

interface Props {
  item: TodoListItem | null
  listId: string
  onSave: (item: TodoListItem) => Promise<void>
  onClose: () => void
}

export default function TodoForm({ item, listId, onSave, onClose }: Props) {
  const { isNew, title, setTitle, description, setDescription, saving, error, clearError, handleSubmit } =
    useTodoForm({ item, listId, onSave })

  return (
    <Dialog title={isNew ? 'New Item' : 'Edit Item'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            clearError()
          }}
          placeholder="What needs to be done?"
          autoFocus
          error={error}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description{' '}
            <span className="font-normal text-gray-400 dark:text-gray-500">
              (optional — supports Markdown)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details... **bold**, _italic_, `code`, - lists"
            rows={4}
            className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)] resize-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Item' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
