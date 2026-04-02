import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTodosStore } from '../../store/todos.store'
import type { Todo } from '../../types/models'
import TodoList from '../todos/TodoList'
import TodoForm from '../todos/TodoForm'

export default function TodosPage() {
  const todos = useTodosStore((s) => s.todos)
  const load = useTodosStore((s) => s.load)
  const save = useTodosStore((s) => s.save)
  const remove = useTodosStore((s) => s.remove)
  const reorder = useTodosStore((s) => s.reorder)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)

  useEffect(() => { load() }, [load])

  function handleToggle(t: Todo) {
    const now = new Date().toISOString()
    save({ ...t, completed: !t.completed, completedAt: !t.completed ? now : undefined, updatedAt: now })
  }

  const incomplete = todos.filter((t) => !t.completed)
  const complete = todos.filter((t) => t.completed)

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] dark:bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">
          Todos
          {incomplete.length > 0 && (
            <span className="ml-2 text-blue-500 dark:text-blue-400">{incomplete.length}</span>
          )}
        </span>
        <button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="flex items-center gap-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-400"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {todos.length === 0 ? (
          <p className="text-[13px] text-slate-400 dark:text-white/25 text-center py-12">No todos yet</p>
        ) : (
          <>
            <div className="py-1">
              <TodoList
                todos={incomplete}
                onToggle={handleToggle}
                onEdit={(t) => { setEditing(t); setFormOpen(true) }}
                onDelete={remove}
                onReorder={reorder}
              />
            </div>
            {complete.length > 0 && (
              <div className="mt-1 border-t border-slate-100 dark:border-white/[0.05] pt-2 pb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 dark:text-white/20 px-4 mb-1">Done</p>
                <TodoList
                  todos={complete}
                  onToggle={handleToggle}
                  onEdit={(t) => { setEditing(t); setFormOpen(true) }}
                  onDelete={remove}
                  onReorder={reorder}
                />
              </div>
            )}
          </>
        )}
      </div>

      {formOpen && (
        <TodoForm
          todo={editing}
          onSave={async (t) => { await save(t); setFormOpen(false); setEditing(null) }}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
