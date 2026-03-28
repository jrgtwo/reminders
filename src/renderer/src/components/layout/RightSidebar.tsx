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
        className={`flex flex-col border-l border-slate-300/60 dark:border-white/[0.07] transition-[width] duration-200 overflow-hidden bg-[#F3F4F6] dark:bg-[#0d1117] ${
          rightOpen ? 'w-64' : 'w-11'
        }`}
      >
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-black/30 dark:border-black/60 bg-[#1c1f26] dark:bg-[#010409] shrink-0 h-11">
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/[0.08] transition-all ${rightOpen ? '' : 'mx-auto'}`}
          >
            {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {rightOpen && (
            <>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2 flex-1">
                Todos
              </span>
              {incomplete.length > 0 && (
                <span className="text-[11px] font-bold text-blue-400 tabular-nums">
                  {incomplete.length}
                </span>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {rightOpen ? (
            todos.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-white/25 text-center py-8 leading-relaxed">
                No todos yet
              </p>
            ) : (
              <>
                <div className="py-1">
                  <TodoList
                    todos={incomplete}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={remove}
                    onReorder={reorder}
                  />
                </div>
                {complete.length > 0 && (
                  <div className="mt-1 border-t border-slate-100 dark:border-white/[0.05] pt-2 pb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 dark:text-white/20 px-4 mb-1">
                      Done
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
            <div className="flex flex-col items-center pt-3">
              <CheckSquare size={14} className="text-slate-300 dark:text-white/20" />
              {incomplete.length > 0 && (
                <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-2">
                  {incomplete.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Add button */}
        {rightOpen && (
          <div className="p-3 border-t border-slate-200 dark:border-white/[0.07] shrink-0">
            <button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] px-3 py-2 rounded-lg transition-all"
            >
              <Plus size={13} />
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
