import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { TodoList, TodoListItem } from '../../types/models'
import SortableTodoList from '../todos/TodoList'

export default function DayViewTodosTab({
  dayLists,
  items,
  expandedListIds,
  editingListTitleId,
  setEditingListTitleId,
  editingItemId,
  setEditingItemId,
  toggleListExpanded,
  handleToggleItem,
  handleAddItem,
  handleSaveEdit,
  handleSaveDesc,
  handleCancelEdit,
  handleDeleteItem,
  handleDeleteList,
  handleCreateInlineList,
  handleSaveListTitle,
  reorderItems,
}: {
  dayLists: TodoList[]
  items: Map<string, TodoListItem[]>
  expandedListIds: Set<string>
  editingListTitleId: string | null
  setEditingListTitleId: (id: string | null) => void
  editingItemId: string | null
  setEditingItemId: (id: string | null) => void
  toggleListExpanded: (id: string) => void
  handleToggleItem: (item: TodoListItem) => void
  handleAddItem: (listId: string) => void
  handleSaveEdit: (item: TodoListItem, title: string) => void
  handleSaveDesc: (item: TodoListItem, desc: string) => void
  handleCancelEdit: (item: TodoListItem) => void
  handleDeleteItem: (id: string, e: React.MouseEvent) => void
  handleDeleteList: (id: string, e: React.MouseEvent) => void
  handleCreateInlineList: () => void
  handleSaveListTitle: (listId: string, name: string) => void
  reorderItems: (listId: string, ids: string[]) => void
}) {
  if (dayLists.length === 0) {
    return (
      <div className="mb-8 flex flex-col gap-2">
        <div className="min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-[13px] text-slate-400 dark:text-white/50 mb-4">
                No lists for this day yet.
              </p>
              <button
                onClick={handleCreateInlineList}
                className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
              >
                + New list
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 flex flex-col gap-2">
      {dayLists.map((l) => {
        const isExpanded = expandedListIds.has(l.id)
        const listItems = (items.get(l.id) ?? [])
          .filter((i) => !i.completed)
          .sort((a, b) => a.order - b.order)
        const completedItems = (items.get(l.id) ?? [])
          .filter((i) => i.completed)
          .sort((a, b) => a.order - b.order)
        const totalCount = listItems.length + completedItems.length
        return (
          <div
            key={l.id}
            className="bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] rounded-xl shadow-sm hover:-translate-y-[3px] hover:shadow-lg dark:hover:shadow-none dark:hover:brightness-125 dark:hover:border-white/25 active:translate-y-[1px] active:shadow-sm dark:active:shadow-none dark:active:brightness-100 transition-[translate,box-shadow,background-color,border-color,filter] duration-200 ease-out"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => toggleListExpanded(l.id)}
                className="flex items-center gap-1.5 min-w-0 flex-1 group"
              >
                <ChevronRight
                  size={20}
                  className={`shrink-0 text-slate-400 dark:text-white/55 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                {editingListTitleId === l.id ? (
                  <input
                    autoFocus
                    defaultValue={l.name}
                    placeholder="List name"
                    className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 dark:text-white/80 placeholder:text-slate-300 dark:placeholder:text-white/50 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => handleSaveListTitle(l.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveListTitle(l.id, e.currentTarget.value)
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        handleSaveListTitle(l.id, e.currentTarget.value)
                      }
                    }}
                  />
                ) : (
                  <span className="text-[14px] font-medium text-slate-800 dark:text-white/80 truncate">
                    {l.name || (
                      <span className="italic text-slate-400 dark:text-white/55">Untitled</span>
                    )}
                  </span>
                )}
                {!isExpanded && totalCount > 0 && (
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-white/55 ml-1">
                    {totalCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={() => setEditingListTitleId(l.id)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-white/55 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteList(l.id, e)
                  }}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-white/55 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                {isExpanded && (
                  <button
                    onClick={() => handleAddItem(l.id)}
                    className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                  >
                    + Add item
                  </button>
                )}
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-3 pt-0 border-t border-slate-100 dark:border-white/[0.05]">
                {listItems.length === 0 && completedItems.length === 0 ? (
                  <p className="text-[13px] text-slate-400 dark:text-white/50 pt-3">
                    No items yet. Add one above.
                  </p>
                ) : (
                  <>
                    <div className="pt-2">
                      <SortableTodoList
                        todos={listItems}
                        onToggle={handleToggleItem}
                        onEdit={(i) => setEditingItemId(i.id)}
                        onDelete={handleDeleteItem}
                        onReorder={(ids) => reorderItems(l.id, ids)}
                        editingItemId={editingItemId}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveDesc={handleSaveDesc}
                      />
                    </div>
                    {completedItems.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/50 mb-2">
                          Done
                        </p>
                        <SortableTodoList
                          todos={completedItems}
                          onToggle={handleToggleItem}
                          onEdit={(i) => setEditingItemId(i.id)}
                          onDelete={handleDeleteItem}
                          onReorder={(ids) => reorderItems(l.id, ids)}
                          editingItemId={editingItemId}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onSaveDesc={handleSaveDesc}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <button
        onClick={handleCreateInlineList}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        New list
      </button>
    </div>
  )
}
