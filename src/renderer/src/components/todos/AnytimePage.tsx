import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTodosStore } from '../../store/todos.store'
import type { Todo } from '../../types/models'
import SortableTodoList from './TodoList'
import TodoForm from './TodoForm'

export default function AnytimePage() {
  const navigate = useNavigate()

  const todos = useTodosStore((s) => s.todos)
  const load = useTodosStore((s) => s.load)
  const save = useTodosStore((s) => s.save)
  const remove = useTodosStore((s) => s.remove)
  const reorder = useTodosStore((s) => s.reorder)

  const [todoFormOpen, setTodoFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  useEffect(() => { load() }, [load])

  const incomplete = useMemo(
    () => todos.filter((t) => !t.completed && !t.dueDate && !t.listId).sort((a, b) => a.order - b.order),
    [todos],
  )
  const complete = useMemo(
    () => todos.filter((t) => t.completed && !t.dueDate && !t.listId).sort((a, b) => a.order - b.order),
    [todos],
  )

  function handleToggle(t: Todo) {
    const now = new Date().toISOString()
    save({ ...t, completed: !t.completed, completedAt: !t.completed ? now : undefined, updatedAt: now })
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[12px] text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          Calendar
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-slate-900 dark:text-white/80 tracking-tight" style={{ fontFamily: "'Bree Serif', serif" }}>
            Anytime
          </h1>
          <button
            onClick={() => { setEditingTodo(null); setTodoFormOpen(true) }}
            className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
          >+ Add</button>
        </div>

        {incomplete.length === 0 && complete.length === 0 ? (
          <p className="text-[13px] text-slate-400 dark:text-white/25">No todos yet. Add one above.</p>
        ) : (
          <>
            <SortableTodoList
              todos={incomplete}
              onToggle={handleToggle}
              onEdit={(t) => { setEditingTodo(t); setTodoFormOpen(true) }}
              onDelete={remove}
              onReorder={reorder}
            />
            {complete.length > 0 && (
              <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">Done</p>
                <SortableTodoList
                  todos={complete}
                  onToggle={handleToggle}
                  onEdit={(t) => { setEditingTodo(t); setTodoFormOpen(true) }}
                  onDelete={remove}
                  onReorder={reorder}
                />
              </div>
            )}
          </>
        )}
      </div>

      {todoFormOpen && (
        <TodoForm
          todo={editingTodo}
          onSave={async (t) => { await save(t); setTodoFormOpen(false); setEditingTodo(null) }}
          onClose={() => { setTodoFormOpen(false); setEditingTodo(null) }}
        />
      )}
    </div>
  )
}
