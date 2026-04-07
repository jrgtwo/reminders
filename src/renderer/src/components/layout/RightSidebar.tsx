import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  List,
  FolderOpen
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import { buildFolderTree, getDescendantIds } from '../../lib/folderTree'

import type { TodoFolder, TodoList } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'
import NotesNav from '../notes/NotesNav'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree } from '../ui/FolderNav'

// --- Date hierarchy helpers ---
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

type DayMap = Record<string, TodoList[]>
type MonthMap = Record<string, DayMap>
type YearMap = Record<string, MonthMap>

function buildDateTree(lists: TodoList[]): YearMap {
  const tree: YearMap = {}
  for (const l of lists) {
    if (!l.dueDate) continue
    const [year, month, day] = l.dueDate.split('-')
    if (!tree[year]) tree[year] = {}
    if (!tree[year][month]) tree[year][month] = {}
    if (!tree[year][month][day]) tree[year][month][day] = []
    tree[year][month][day].push(l)
  }
  return tree
}

function DateSection({
  lists,
  activeListId,
  onNewListForDate,
  onDeleteList
}: {
  lists: TodoList[]
  activeListId?: string
  onNewListForDate: (date: string) => void
  onDeleteList: (id: string) => void
}) {
  const tree = useMemo(() => buildDateTree(lists), [lists])
  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))

  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set())
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  if (years.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
        No date-based lists yet
      </p>
    )
  }

  return (
    <>
      {years.map((year) => {
        const yearCollapsed = collapsedYears.has(year)
        const months = Object.keys(tree[year]).sort((a, b) => b.localeCompare(a))
        return (
          <div key={year}>
            <button
              onClick={() =>
                setCollapsedYears((prev) => {
                  const next = new Set(prev)
                  next.has(year) ? next.delete(year) : next.add(year)
                  return next
                })
              }
              className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              {yearCollapsed ? (
                <ChevronRight size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
              ) : (
                <ChevronDown size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
              )}
              <span className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wide">
                {year}
              </span>
            </button>

            {!yearCollapsed &&
              months.map((month) => {
                const monthKey = `${year}-${month}`
                const monthCollapsed = collapsedMonths.has(monthKey)
                const days = Object.keys(tree[year][month]).sort((a, b) => b.localeCompare(a))
                const monthName = MONTH_NAMES[parseInt(month, 10) - 1]

                return (
                  <div key={month}>
                    <button
                      onClick={() =>
                        setCollapsedMonths((prev) => {
                          const next = new Set(prev)
                          next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey)
                          return next
                        })
                      }
                      className="flex items-center gap-1.5 w-full pl-6 pr-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {monthCollapsed ? (
                        <ChevronRight
                          size={9}
                          className="text-slate-300 dark:text-white/20 shrink-0"
                        />
                      ) : (
                        <ChevronDown
                          size={9}
                          className="text-slate-300 dark:text-white/20 shrink-0"
                        />
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30">
                        {monthName}
                      </span>
                    </button>

                    {!monthCollapsed &&
                      days.map((day) => {
                        const dayLists = tree[year][month][day]
                        const dateStr = `${year}-${month}-${day}`
                        return (
                          <div key={day}>
                            <div className="flex items-center pl-10 pr-4 py-0.5">
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-white/25 flex-1">
                                {parseInt(day, 10)}
                              </span>
                              <button
                                onClick={() => onNewListForDate(dateStr)}
                                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                                title={`New list for ${dateStr}`}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            {dayLists.map((l) => (
                              <SidebarNavItem
                                key={l.id}
                                id={l.id}
                                label={l.name}
                                active={activeListId === l.id}
                                route={`/lists/${l.id}`}
                                icon={List}
                                indent
                                onDelete={onDeleteList}
                                deleteTitle="Delete list"
                              />
                            ))}
                          </div>
                        )
                      })}
                  </div>
                )
              })}
          </div>
        )
      })}
    </>
  )
}

export default function RightSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const rightOpen = useUIStore((s) => s.rightOpen)
  const setRightOpen = useUIStore((s) => s.setRightOpen)

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)
  const removeFolder = useTodoFoldersStore((s) => s.remove)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)
  const removeList = useTodoListsStore((s) => s.remove)

  const [width, setWidth] = useState(256)
  const dragging = useRef(false)

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startWidth = width

    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      setWidth(Math.max(180, Math.min(520, startWidth - (e.clientX - startX))))
    }
    function onMouseUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<TodoFolder | null>(null)
  const [pendingParentFolderId, setPendingParentFolderId] = useState<string | undefined>()
  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)
  const [newListFolderId, setNewListFolderId] = useState<string | undefined>()
  const [newListDueDate, setNewListDueDate] = useState<string | undefined>()
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [draggingListId, setDraggingListId] = useState<string | null>(null)
  const [listDropTarget, setListDropTarget] = useState<string | 'standalone' | null>(null)

  useEffect(() => {
    loadFolders()
    loadLists()
  }, [loadFolders, loadLists])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

  const adHocLists = useMemo(
    () => lists.filter((l) => !l.dueDate).sort((a, b) => a.order - b.order),
    [lists]
  )
  const dateLists = useMemo(() => lists.filter((l) => !!l.dueDate), [lists])

  const standaloneLists = useMemo(() => adHocLists.filter((l) => !l.folderId), [adHocLists])
  const folderChildrenMap = useMemo(() => buildFolderTree(folders), [folders])
  const rootFolders = useMemo(
    () => (folderChildrenMap.get(undefined) ?? []).sort((a, b) => a.order - b.order),
    [folderChildrenMap]
  )

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openNewList(opts: { folderId?: string; dueDate?: string } = {}) {
    setEditingList(null)
    setNewListFolderId(opts.folderId)
    setNewListDueDate(opts.dueDate)
    setListFormOpen(true)
  }

  const listCount = lists.length

  function handleDeleteFolder(id: string) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const descendantIds = getDescendantIds(id, folderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedLists = adHocLists.filter((l) => l.folderId && allFolderIds.has(l.folderId))
    if (affectedLists.length > 0 || descendantIds.size > 0) {
      const msg = [
        descendantIds.size > 0 ? `${descendantIds.size} subfolder(s)` : '',
        affectedLists.length > 0 ? `${affectedLists.length} list(s)` : '',
      ].filter(Boolean).join(' and ')
      if (!window.confirm(`This folder contains ${msg}. Delete everything?`)) return
    }
    allFolderIds.forEach((fid) => removeFolder(fid))
  }

  function handleListDrop(targetFolderId: string | undefined) {
    if (!draggingListId) return
    const list = lists.find((l) => l.id === draggingListId)
    if (!list || list.folderId === targetFolderId) return
    saveList({ ...list, folderId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingListId(null)
    setListDropTarget(null)
  }

  function handleDeleteList(id: string) {
    removeList(id)
  }

  function renderList(l: TodoList, indent: boolean): ReactNode {
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
        onDragStart={setDraggingListId}
        onDragEnd={() => { setDraggingListId(null); setListDropTarget(null) }}
      />
    )
  }

  return (
    <>
      <aside
        className="relative h-full flex flex-col border-l border-slate-300/60 dark:border-white/[0.07] overflow-hidden bg-[var(--bg-app)] transition-[width] duration-200"
        style={{ width: rightOpen ? width : 44 }}
      >
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-black/30 dark:border-black/60 bg-[var(--bg-header)] shrink-0 h-11">
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/[0.08] transition-all ${rightOpen ? '' : 'mx-auto'}`}
          >
            {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {rightOpen && (
            <>
              <span className="text-[11px] font-semibold text-white/50 ml-2 flex-1">Lists</span>
              {listCount > 0 && (
                <span className="text-[11px] font-bold text-blue-400 tabular-nums">
                  {listCount}
                </span>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {rightOpen && (
            <>
              {/* Ad-hoc lists */}
              <div
                className={`py-1 ${dateLists.length > 0 ? 'border-t border-slate-200 dark:border-white/[0.07]' : ''}`}
              >
                <CollapsibleSection
                  label="My Lists"
                  count={adHocLists.length}
                  accent="slate"
                  defaultOpen
                  headerExtra={
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openNewList()}
                        className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        title="New list"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingFolder(null)
                          setPendingParentFolderId(undefined)
                          setFolderFormOpen(true)
                        }}
                        className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        title="New folder"
                      >
                        <FolderOpen size={11} />
                      </button>
                    </div>
                  }
                >
                  {adHocLists.length === 0 && folders.length === 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
                      No lists yet
                    </p>
                  )}
                  <div
                    onDragOver={(e) => { if (draggingListId) { e.preventDefault(); setListDropTarget('standalone') } }}
                    onDragLeave={() => setListDropTarget(null)}
                    onDrop={(e) => { e.preventDefault(); handleListDrop(undefined) }}
                    className={`transition-colors rounded mx-1 ${listDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
                  >
                    {standaloneLists.map((l) => renderList(l, false))}
                    {listDropTarget === 'standalone' && standaloneLists.length === 0 && (
                      <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">Drop here to remove from folder</p>
                    )}
                  </div>
                  <FolderTree
                    rootFolders={rootFolders}
                    folderChildrenMap={folderChildrenMap}
                    getOrder={(f) => f.order}
                    getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
                    renderItem={renderList}
                    draggingItemId={draggingListId}
                    dropTarget={listDropTarget}
                    setDropTarget={setListDropTarget}
                    onDrop={handleListDrop}
                    collapsedFolders={collapsedFolders}
                    onToggleFolder={toggleFolder}
                    onEditFolder={(folder) => {
                      setEditingFolder(folder)
                      setPendingParentFolderId(undefined)
                      setFolderFormOpen(true)
                    }}
                    onDeleteFolder={handleDeleteFolder}
                    onNewSubfolder={(parentId) => {
                      setEditingFolder(null)
                      setPendingParentFolderId(parentId)
                      setFolderFormOpen(true)
                    }}
                    onNewItemInFolder={(folderId) => openNewList({ folderId })}
                  />
                </CollapsibleSection>
              </div>

              {/* By Date section */}
              {dateLists.length > 0 && (
                <div className="border-t border-slate-200 dark:border-white/[0.07] pt-1 pb-2">
                  <CollapsibleSection
                    label="By Date"
                    count={dateLists.length}
                    accent="slate"
                    defaultOpen
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
                    <DateSection
                      lists={dateLists}
                      activeListId={activeListId}
                      onNewListForDate={(date) => openNewList({ dueDate: date })}
                      onDeleteList={handleDeleteList}
                    />
                  </CollapsibleSection>
                </div>
              )}

              {lists.length === 0 && folders.length === 0 && (
                <p className="text-[12px] text-slate-400 dark:text-white/25 text-center py-8 leading-relaxed">
                  No lists yet
                </p>
              )}

              {/* Notes section */}
              <div className="py-1 border-t border-slate-200 dark:border-white/[0.07]">
                <NotesNav />
              </div>
            </>
          )}

          {!rightOpen && (
            <div className="flex flex-col items-center pt-3">
              <CheckSquare size={14} className="text-slate-300 dark:text-white/20" />
              {listCount > 0 && (
                <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-2">
                  {listCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        {rightOpen && (
          <div
            onMouseDown={onResizeStart}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors"
          />
        )}

        {/* Bottom */}
        {rightOpen && (
          <div className="p-3 border-t border-slate-200 dark:border-white/[0.07] shrink-0">
            <button
              onClick={() => openNewList()}
              className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] px-3 py-2 rounded-lg transition-all"
            >
              <Plus size={13} />
              New List
            </button>
          </div>
        )}
      </aside>

      {folderFormOpen && (
        <FolderForm
          folder={editingFolder}
          parentId={pendingParentFolderId}
          onSave={async (f) => {
            await saveFolder(f)
            setFolderFormOpen(false)
            setEditingFolder(null)
            setPendingParentFolderId(undefined)
          }}
          onClose={() => {
            setFolderFormOpen(false)
            setEditingFolder(null)
            setPendingParentFolderId(undefined)
          }}
        />
      )}

      {listFormOpen && (
        <ListForm
          list={editingList}
          folders={folders}
          defaultFolderId={newListFolderId}
          defaultDueDate={newListDueDate}
          onSave={async (l) => {
            await saveList(l)
            setListFormOpen(false)
            setEditingList(null)
            navigate(`/lists/${l.id}`)
          }}
          onClose={() => {
            setListFormOpen(false)
            setEditingList(null)
          }}
        />
      )}
    </>
  )
}
