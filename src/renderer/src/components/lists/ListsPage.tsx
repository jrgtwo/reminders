import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, List, Pencil } from 'lucide-react'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import type { TodoListItem, TodoList } from '../../types/models'
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
  const items = useTodoListsStore((s) => s.items)
  const loadItems = useTodoListsStore((s) => s.loadItems)
  const saveItem = useTodoListsStore((s) => s.saveItem)
  const deleteItem = useTodoListsStore((s) => s.deleteItem)
  const reorderItems = useTodoListsStore((s) => s.reorderItems)

  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TodoListItem | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)

  useEffect(() => {
    loadLists()
  }, [loadLists])

  useEffect(() => {
    if (listId) loadItems(listId)
  }, [listId, loadItems])

  const selectedList = useMemo<TodoList | null>(
    () => lists.find((l) => l.id === listId) ?? null,
    [lists, listId]
  )

  const listItems = useMemo(
    () => (listId ? (items.get(listId) ?? []).filter((i) => !i.completed).sort((a, b) => a.order - b.order) : []),
    [items, listId]
  )
  const completedItems = useMemo(
    () => (listId ? (items.get(listId) ?? []).filter((i) => i.completed).sort((a, b) => a.order - b.order) : []),
    [items, listId]
  )

  function handleToggle(item: TodoListItem) {
    const now = new Date().toISOString()
    saveItem({ ...item, completed: !item.completed, completedAt: !item.completed ? now : undefined, updatedAt: now })
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[12px] text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {!selectedList ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-white/25 gap-2">
            <List size={32} className="opacity-30" />
            <p className="text-[13px]">Select a list</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl text-slate-900 dark:text-white/80 tracking-tight" style={{ fontFamily: "'Bree Serif', serif" }}>
                  {selectedList.name}
                </h1>
                {selectedList.dueDate && (
                  <p className="text-[12px] text-slate-400 dark:text-white/30 mt-0.5">{selectedList.dueDate}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRenameOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { setEditingItem(null); setItemFormOpen(true) }}
                  className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                >
                  + Add
                </button>
              </div>
            </div>

            {listItems.length === 0 && completedItems.length === 0 ? (
              <p className="text-[13px] text-slate-400 dark:text-white/25">No items yet. Add one above.</p>
            ) : (
              <>
                <SortableTodoList
                  todos={listItems}
                  onToggle={handleToggle}
                  onEdit={(i) => { setEditingItem(i); setItemFormOpen(true) }}
                  onDelete={deleteItem}
                  onReorder={(ids) => reorderItems(listId!, ids)}
                />
                {completedItems.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">Done</p>
                    <SortableTodoList
                      todos={completedItems}
                      onToggle={handleToggle}
                      onEdit={(i) => { setEditingItem(i); setItemFormOpen(true) }}
                      onDelete={deleteItem}
                      onReorder={(ids) => reorderItems(listId!, ids)}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {itemFormOpen && listId && (
        <TodoForm
          item={editingItem}
          listId={listId}
          onSave={async (item) => { await saveItem(item); setItemFormOpen(false); setEditingItem(null) }}
          onClose={() => { setItemFormOpen(false); setEditingItem(null) }}
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
