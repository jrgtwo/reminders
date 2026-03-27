import { useEffect, useState } from 'react'
import { CheckSquare, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTodosStore } from '../../store/todos.store'
import { useUIStore } from '../../store/ui.store'
import type { Todo } from '../../types/models'
import TodoForm from '../todos/TodoForm'
import TodoList from '../todos/TodoList'

export default function RightSidebar() {
  const rightOpen = useUIStore((s) => s.rightOpen)
  const setRightOpen = useUIStore((s) => s.setRightOpen)
  const triggerNewTodo = useUIStore((s) => s.triggerNewTodo)
  const setTriggerNewTodo = useUIStore((s) => s.setTriggerNewTodo)

  const todos = useTodosStore((s) => s.todos)
  const load = useTodosStore((s) => s.load)
  const save = useTodosStore((s) => s.save)
  const remove = useTodosStore((s) => s.remove)
  const reorder = useTodosStore((s) => s.reorder)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!triggerNewTodo) return
    setTriggerNewTodo(false)
    setRightOpen(true)
    setEditing(null)
    setFormOpen(true)
  }, [triggerNewTodo, setTriggerNewTodo, setRightOpen])

  async function handleSave(t: Todo) {
    await save(t)
    setFormOpen(false)
    setEditing(null)
  }

  function handleEdit(t: Todo) {
    setEditing(t)
    setFormOpen(true)
  }

  function handleToggle(t: Todo) {
    const now = new Date().toISOString()
    save({
      ...t,
      completed: !t.completed,
      completedAt: !t.completed ? now : undefined,
      updatedAt: now,
    })
  }

  const incomplete = todos.filter((t) => !t.completed)
  const complete = todos.filter((t) => t.completed)

  return (
    <>
      <aside
        className={`flex flex-col border-l border-gray-200 dark:border-white/[0.08] transition-[width] duration-200 overflow-hidden bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl ${
          rightOpen ? 'w-72' : 'w-12'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-white/[0.07] bg-gray-50/50 dark:bg-white/[0.03]">
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-all"
          >
            {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {rightOpen && (
            <span className="text-sm font-semibold text-gray-700 dark:text-white/70 ml-2 flex-1">Todos</span>
          )}
          {rightOpen && (
            <span className="text-xs text-gray-400 dark:text-white/30">{incomplete.length} left</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {rightOpen ? (
            todos.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-white/30 text-center py-6">No todos yet</p>
            ) : (
              <>
                <TodoList
                  todos={incomplete}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={remove}
                  onReorder={reorder}
                />
                {complete.length > 0 && (
                  <div className="mt-3 px-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25 mb-1 px-2">
                      Completed
                    </p>
                    <TodoList
                      todos={complete}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={remove}
                      onReorder={reorder}
                    />
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 pt-2">
              <CheckSquare size={16} className="text-gray-400 dark:text-white/30" />
              {incomplete.length > 0 && (
                <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">{incomplete.length}</span>
              )}
            </div>
          )}
        </div>

        {/* Add button */}
        {rightOpen && (
          <div className="p-3 border-t border-gray-200 dark:border-white/[0.07]">
            <button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              className="flex items-center justify-center gap-2 w-full text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.14] border border-gray-200 dark:border-white/[0.12] px-3 py-2 rounded-lg transition-all"
            >
              <Plus size={14} />
              Add Todo
            </button>
          </div>
        )}
      </aside>

      {formOpen && (
        <TodoForm
          todo={editing}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
