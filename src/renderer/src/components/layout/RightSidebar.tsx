import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import { buildFolderTree, getDescendantIds } from '../../lib/folderTree'
import { useRemindersStore } from '../../store/reminders.store'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { today, parseDateStr } from '../../utils/dates'

import type { TodoFolder, TodoList } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'
import NotesNav from '../notes/NotesNav'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'

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
  const asideRef = useRef<HTMLElement>(null)

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startWidth = width
    const el = asideRef.current!
    el.style.transition = 'none'
    let lastWidth = startWidth

    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      lastWidth = Math.max(180, Math.min(520, startWidth - (e.clientX - startX)))
      el.style.width = lastWidth + 'px'
    }
    function onMouseUp() {
      dragging.current = false
      el.style.transition = ''
      setWidth(lastWidth)
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [draggingListId, setDraggingListId] = useState<string | null>(null)
  const [listDropTarget, setListDropTarget] = useState<string | 'standalone' | null>(null)

  // Reminders data
  const reminders = useRemindersStore((s) => s.reminders)
  const t = useMemo(() => today(), [])
  const yesterday = useMemo(() => t.subtract({ days: 1 }), [t])
  const weekStart = useMemo(() => t.subtract({ days: t.dayOfWeek - 1 }), [t])
  const weekEnd = useMemo(() => weekStart.add({ days: 6 }), [weekStart])

  const overdueReminders = useMemo(() => {
    const start = t.subtract({ days: 365 })
    const end = yesterday
    const items: { id: string; title: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, dateStr })
      }
    }
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    return items
  }, [reminders, t, yesterday])

  const upcomingReminders = useMemo(() => {
    const start = today()
    const end = start.add({ days: 30 })
    const items: { id: string; title: string; startTime?: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, startTime: r.startTime, dateStr })
      }
    }
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return items
  }, [reminders])

  const overdueYesterday = overdueReminders.filter((i) => i.dateStr === yesterday.toString())
  const overdueThisWeek = overdueReminders.filter(
    (i) => i.dateStr >= weekStart.toString() && i.dateStr < yesterday.toString()
  )
  const overdueOlder = overdueReminders.filter((i) => i.dateStr < weekStart.toString())
  const upcomingToday = upcomingReminders.filter((i) => i.dateStr === t.toString())
  const upcomingThisWeek = upcomingReminders.filter(
    (i) => i.dateStr > t.toString() && i.dateStr <= weekEnd.toString()
  )
  const upcomingLater = upcomingReminders.filter((i) => i.dateStr > weekEnd.toString())

  function formatOverdueDate(dateStr: string): string {
    const d = parseDateStr(dateStr)
    const diff = d.until(t, { largestUnit: 'days' }).days
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatUpcomingDate(dateStr: string): string {
    const d = parseDateStr(dateStr)
    const diff = t.until(d, { largestUnit: 'days' }).days
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function ReminderItem({
    id,
    dateStr,
    title,
    time,
    variant
  }: {
    id: string
    dateStr: string
    title: string
    time?: string
    variant: 'overdue' | 'upcoming'
  }) {
    return (
      <li key={`${id}-${dateStr}`}>
        <button
          onClick={() => navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })}
          className={`w-full text-left px-3 py-2 rounded-xl transition-all group ${
            variant === 'overdue'
              ? 'bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08] hover:shadow-sm'
              : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm'
          }`}
        >
          <div
            className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-blue-500 dark:text-[#6498c8]/80'}`}
          >
            {variant === 'overdue' ? formatOverdueDate(dateStr) : formatUpcomingDate(dateStr)}
          </div>
          <div className="text-[12px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-[#f0f0f0]">
            {title}
          </div>
          {time && (
            <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{time}</div>
          )}
        </button>
      </li>
    )
  }

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
    setExpandedFolders((prev) => {
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
        ref={asideRef}
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
            <span className="text-[11px] font-semibold text-white/50 ml-2 flex-1">Tasks & Notes</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {rightOpen && (
            <>
              {/* Reminders section */}
              <div className="py-1">
                <CollapsibleSection
                  label="Reminders"
                  count={overdueReminders.length + upcomingReminders.length}
                  accent="blue"
                  defaultOpen
                  headerExtra={
                    <button
                      onClick={() => navigate('/reminders')}
                      className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                      title="Go to Reminders"
                    >
                      <ArrowUpRight size={11} />
                    </button>
                  }
                >
                  {overdueReminders.length === 0 && upcomingReminders.length === 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2 text-center">
                      No upcoming reminders
                    </p>
                  )}
                  {overdueReminders.length > 0 && (
                    <CollapsibleSection
                      label="Overdue"
                      count={overdueReminders.length}
                      accent="red"
                      defaultOpen={false}
                    >
                      <div className="flex flex-col gap-0.5">
                        {overdueYesterday.length > 0 && (
                          <CollapsibleSection
                            label="Yesterday"
                            count={overdueYesterday.length}
                            accent="red"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueYesterday.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {overdueThisWeek.length > 0 && (
                          <CollapsibleSection
                            label="This Week"
                            count={overdueThisWeek.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueThisWeek.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {overdueOlder.length > 0 && (
                          <CollapsibleSection
                            label="Older"
                            count={overdueOlder.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueOlder.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                  {upcomingReminders.length > 0 && (
                    <CollapsibleSection
                      label="Upcoming"
                      count={upcomingReminders.length}
                      accent="blue"
                      defaultOpen={false}
                    >
                      <div className="flex flex-col gap-0.5">
                        {upcomingToday.length > 0 && (
                          <CollapsibleSection
                            label="Today"
                            count={upcomingToday.length}
                            accent="blue"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingToday.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {upcomingThisWeek.length > 0 && (
                          <CollapsibleSection
                            label="This Week"
                            count={upcomingThisWeek.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingThisWeek.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {upcomingLater.length > 0 && (
                          <CollapsibleSection
                            label="Later"
                            count={upcomingLater.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingLater.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                </CollapsibleSection>
              </div>

              {/* Notes section */}
              <div className="py-1 border-t-2 border-slate-200 dark:border-white/[0.1] mt-1">
                <NotesNav />
              </div>

              {/* Lists section */}
              <div className="py-1 border-t-2 border-slate-200 dark:border-white/[0.1] mt-1">
                <CollapsibleSection
                  label="Lists"
                  count={lists.length}
                  accent="blue"
                  defaultOpen
                  headerExtra={
                    <button
                      onClick={() => navigate('/todos')}
                      className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                      title="Go to Lists"
                    >
                      <ArrowUpRight size={11} />
                    </button>
                  }
                >
                  {/* My Lists */}
                  <CollapsibleSection
                    label="My Lists"
                    count={adHocLists.length}
                    accent="slate"
                    defaultOpen={false}
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
                      expandedFolders={expandedFolders}
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

                  {/* By Date */}
                  {dateLists.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
                      <CollapsibleSection
                        label="By Date"
                        count={dateLists.length}
                        accent="slate"
                        defaultOpen={false}
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
