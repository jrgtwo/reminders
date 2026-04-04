import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, List, Pencil } from 'lucide-react'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodosStore } from '../../store/todos.store'
import type { Todo, TodoList } from '../../types/models'
import SortableTodoList from '../todos/TodoList'
import TodoForm from '../todos/TodoForm'
import ListForm from './ListForm'

export default function ListsPage() {
  const { listId } = useParams<{ listId?: string }>()
  const navigate = useNavigate()

  const folders = useTodoFoldersStore((s) => s.folders)
  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)

  const todos = useTodosStore((s) => s.todos)
  const loadTodos = useTodosStore((s) => s.load)
  const saveTodo = useTodosStore((s) => s.save)
  const removeTodo = useTodosStore((s) => s.remove)
  const reorderTodos = useTodosStore((s) => s.reorder)

  const [todoFormOpen, setTodoFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)

  useEffect(() => {
    loadLists()
    loadTodos()
  }, [loadLists, loadTodos])

  const selectedList = useMemo(() => lists.find((l) => l.id === listId) ?? null, [lists, listId])

  const listTodos = useMemo(
    () => todos.filter((t) => t.listId === listId && !t.completed).sort((a, b) => a.order - b.order),
    [todos, listId]
  )
  const completedListTodos = useMemo(
    () => todos.filter((t) => t.listId === listId && t.completed).sort((a, b) => a.order - b.order),
    [todos, listId]
  )

  function handleToggleTodo(t: Todo) {
    const now = new Date().toISOString()
    saveTodo({ ...t, completed: !t.completed, completedAt: !t.completed ? now : undefined, updatedAt: now })
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

        {!selectedList ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-white/25 gap-2">
            <List size={32} className="opacity-30" />
            <p className="text-[13px]">Select a list</p>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-slate-900 dark:text-white/80 tracking-tight" style={{ fontFamily: "'Bree Serif', serif" }}>
            {selectedList.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRenameOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            ><Pencil size={14} /></button>
            <button
              onClick={() => { setEditingTodo(null); setTodoFormOpen(true) }}
              className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
            >+ Add</button>
          </div>
        </div>

        {listTodos.length === 0 && completedListTodos.length === 0 ? (
          <p className="text-[13px] text-slate-400 dark:text-white/25">No todos yet. Add one above.</p>
        ) : (
          <>
            <SortableTodoList
              todos={listTodos}
              onToggle={handleToggleTodo}
              onEdit={(t) => { setEditingTodo(t); setTodoFormOpen(true) }}
              onDelete={removeTodo}
              onReorder={reorderTodos}
            />
            {completedListTodos.length > 0 && (
              <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">Done</p>
                <SortableTodoList
                  todos={completedListTodos}
                  onToggle={handleToggleTodo}
                  onEdit={(t) => { setEditingTodo(t); setTodoFormOpen(true) }}
                  onDelete={removeTodo}
                  onReorder={reorderTodos}
                />
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>

      {todoFormOpen && (
        <TodoForm
          todo={editingTodo}
          defaultListId={editingTodo ? undefined : listId}
          onSave={async (t) => { await saveTodo(t); setTodoFormOpen(false); setEditingTodo(null) }}
          onClose={() => { setTodoFormOpen(false); setEditingTodo(null) }}
        />
      )}

      {renameOpen && selectedList && (
        <ListForm
          list={selectedList}
          folders={folders}
          defaultFolderId={selectedList.folderId}
          onSave={async (l) => { await saveList(l); setRenameOpen(false) }}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </div>
  )
}
