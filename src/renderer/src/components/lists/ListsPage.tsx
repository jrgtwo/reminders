import { List, Pencil } from 'lucide-react'
import SortableTodoList from '../todos/TodoList'
import ListForm from './ListForm'
import { useListsPage } from './hooks/useListsPage'

export default function ListsPage() {
  const {
    listId,
    folders,
    selectedList,
    listItems,
    completedItems,
    isNew,
    newName,
    setNewName,
    newDate,
    newFolderId,
    createError,
    setCreateError,
    creating,
    nameInputRef,
    editingItemId,
    setEditingItemId,
    renameOpen,
    setRenameOpen,
    editingDate,
    setEditingDate,
    deleteItem,
    reorderItems,
    navigate,
    handleToggle,
    handleAddItem,
    handleSaveEdit,
    handleSaveDesc,
    handleCancelEdit,
    handleCreate,
    handleNewDateChange,
    handleNewFolderChange,
    handleDateChange,
    handleRenameList,
  } = useListsPage()

  if (isNew) {
    return (
      <div className="overflow-y-auto h-full">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <input
                ref={nameInputRef}
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setCreateError('') }}
                placeholder="List name"
                className="w-full bg-transparent text-2xl text-slate-900 dark:text-white/80 tracking-tight placeholder:text-slate-300 dark:placeholder:text-white/50 focus:outline-none"
                style={{ fontFamily: "'Bree Serif', serif" }}
              />
              {createError && <p className="text-[12px] text-red-500 mt-1">{createError}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/55">
                Date <span className="font-normal normal-case tracking-normal text-slate-300 dark:text-white/50">(optional)</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => handleNewDateChange(e.target.value)}
                className="w-fit rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent px-2 py-1 text-[13px] text-slate-700 dark:text-white/60 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
              />
            </div>

            {!newDate && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/55">
                  Folder <span className="font-normal normal-case tracking-normal text-slate-300 dark:text-white/50">(optional)</span>
                </label>
                <select
                  value={newFolderId}
                  onChange={(e) => handleNewFolderChange(e.target.value)}
                  className="w-fit rounded-md border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-transparent px-2 py-1 text-[13px] text-slate-700 dark:text-white/60 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:brightness-90 text-[#f0f0f0] text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create List'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-lg text-[13px] text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {!selectedList ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-white/50 gap-2">
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
                <div className="mt-1">
                  {editingDate ? (
                    <input
                      type="date"
                      defaultValue={selectedList.dueDate ?? ''}
                      autoFocus
                      onBlur={(e) => handleDateChange(e.target.value)}
                      className="rounded border border-slate-200 dark:border-white/[0.08] bg-transparent px-1.5 py-0.5 text-[12px] text-slate-500 dark:text-white/60 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingDate(true)}
                      className="text-[12px] text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/50 transition-colors"
                    >
                      {selectedList.dueDate ?? '+ Add date'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRenameOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-white/55 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={handleAddItem}
                  className="text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
                >
                  + Add
                </button>
              </div>
            </div>

            {listItems.length === 0 && completedItems.length === 0 ? (
              <p className="text-[13px] text-slate-400 dark:text-white/50">No items yet. Add one above.</p>
            ) : (
              <>
                <SortableTodoList
                  todos={listItems}
                  onToggle={handleToggle}
                  onEdit={(i) => setEditingItemId(i.id)}
                  onDelete={deleteItem}
                  onReorder={(ids) => reorderItems(listId!, ids)}
                  editingItemId={editingItemId}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveDesc={handleSaveDesc}
                />
                {completedItems.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/50 mb-2">Done</p>
                    <SortableTodoList
                      todos={completedItems}
                      onToggle={handleToggle}
                      onEdit={(i) => setEditingItemId(i.id)}
                      onDelete={deleteItem}
                      onReorder={(ids) => reorderItems(listId!, ids)}
                      editingItemId={editingItemId}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onSaveDesc={handleSaveDesc}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {renameOpen && selectedList && (
        <ListForm
          list={selectedList}
          folders={folders}
          defaultFolderId={selectedList.folderId}
          onSave={handleRenameList}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </div>
  )
}
