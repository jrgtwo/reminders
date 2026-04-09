import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { Plus, FolderOpen, List } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { buildFolderTree } from '../../lib/folderTree'
import type { TodoFolder, TodoList } from '../../types/models'
import FolderForm from './FolderForm'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'

export interface ListsNavHandle {
  openNewList: () => void
}

const ListsNav = forwardRef<ListsNavHandle>(function ListsNav(_, ref) {
  const navigate = useNavigate()
  const location = useLocation()

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)
  const removeFolder = useTodoFoldersStore((s) => s.remove)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const removeList = useTodoListsStore((s) => s.remove)

  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<TodoFolder | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useImperativeHandle(ref, () => ({ openNewList: () => openNewList() }))

  useEffect(() => {
    loadLists()
    loadFolders()
  }, [loadLists, loadFolders])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

  const adHocLists = useMemo(
    () => lists.filter((l) => !l.dueDate).sort((a, b) => a.order - b.order),
    [lists]
  )
  const dateLists = useMemo(() => lists.filter((l) => !!l.dueDate), [lists])
  const standaloneLists = useMemo(
    () => adHocLists.filter((l) => !l.folderId),
    [adHocLists]
  )
  const folderChildrenMap = useMemo(() => buildFolderTree(folders), [folders])
  const rootFolders = useMemo(
    () => (folderChildrenMap.get(undefined) ?? []).sort((a, b) => a.order - b.order),
    [folderChildrenMap]
  )

  function toggleFolder(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openNewList(opts: { folderId?: string; dueDate?: string } = {}) {
    navigate('/lists/new', { state: opts })
  }

  function handleDeleteList(id: string) {
    removeList(id)
    if (activeListId === id) navigate('/lists')
  }

  function handleDeleteFolder(id: string) {
    const affectedLists = lists.filter((l) => l.folderId === id)
    if (affectedLists.length > 0) {
      if (!window.confirm(`This folder contains ${affectedLists.length} list(s). Delete everything?`)) return
      affectedLists.forEach((l) => removeList(l.id))
    }
    removeFolder(id)
  }

  function renderList(l: TodoList, indent: boolean) {
    return (
      <SidebarNavItem
        key={l.id}
        id={l.id}
        label={l.name}
        active={activeListId === l.id}
        route={`/lists/${l.id}`}
        icon={List}
        indent={indent}
        onDelete={handleDeleteList}
        deleteTitle="Delete list"
      />
    )
  }

  return (
    <>
      <CollapsibleSection
        label="Lists"
        count={lists.length}
        accent="blue"
        defaultOpen={true}
      >
        {/* My Lists */}
        <CollapsibleSection
          label="My Lists"
          count={adHocLists.length}
          accent="slate"
          defaultOpen={true}
        >
          <div className="flex items-center justify-end gap-0.5 px-3 py-1 border-b border-slate-100 dark:border-white/[0.04]">
            <button
              onClick={() => openNewList()}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New list"
            >
              <Plus size={11} />
            </button>
            <button
              onClick={() => { setEditingFolder(null); setFolderFormOpen(true) }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New folder"
            >
              <FolderOpen size={11} />
            </button>
          </div>

          {adHocLists.length === 0 && folders.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No lists yet</p>
          )}

          <FolderTree
            rootFolders={rootFolders}
            folderChildrenMap={folderChildrenMap}
            getOrder={(f) => f.order}
            getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
            renderItem={renderList}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onNewItemInFolder={(folderId) => openNewList({ folderId })}
            onEditFolder={(folder) => { setEditingFolder(folder); setFolderFormOpen(true) }}
            onDeleteFolder={handleDeleteFolder}
          />

          {standaloneLists.map((l) => renderList(l, false))}
        </CollapsibleSection>

        {/* By Date */}
        {dateLists.length > 0 && (
          <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
            <CollapsibleSection
              label="By Date"
              count={dateLists.length}
              accent="slate"
              defaultOpen={false}
              headerExtra={
                <button
                  onClick={() => openNewList()}
                  className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                  title="New date-based list"
                >
                  <Plus size={11} />
                </button>
              }
            >
              <DateTree
                items={dateLists}
                getDate={(l) => l.dueDate}
                renderItem={(l) => (
                  <SidebarNavItem
                    id={l.id}
                    label={l.name}
                    active={activeListId === l.id}
                    route={`/lists/${l.id}`}
                    icon={List}
                    indent
                    onDelete={handleDeleteList}
                    deleteTitle="Delete list"
                  />
                )}
                onNewForDate={(date) => openNewList({ dueDate: date })}
                emptyMessage="No date-based lists yet"
                newItemTitle="New list"
              />
            </CollapsibleSection>
          </div>
        )}
      </CollapsibleSection>

      {folderFormOpen && (
        <FolderForm
          folder={editingFolder}
          onSave={async (f) => { await saveFolder(f); setFolderFormOpen(false); setEditingFolder(null) }}
          onClose={() => { setFolderFormOpen(false); setEditingFolder(null) }}
        />
      )}

    </>
  )
})

export default ListsNav
