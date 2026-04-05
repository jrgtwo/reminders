import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CheckSquare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Plus, ArrowRight, List, FolderOpen,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import { today, parseDateStr } from '../../utils/dates'
import { Temporal } from '@js-temporal/polyfill'
import type { TodoFolder, TodoList } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'

function formatDate(dateStr: string): string {
  const t = today()
  const date = parseDateStr(dateStr)
  const cmp = Temporal.PlainDate.compare(date, t)
  if (cmp === 0) return 'Today'
  const daysDiff = t.until(date, { largestUnit: 'days' }).days
  if (daysDiff === 1) return 'Tomorrow'
  if (daysDiff === -1) return 'Yesterday'
  if (daysDiff > 0 && daysDiff < 7) return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: Math.abs(daysDiff) > 300 ? 'numeric' : undefined })
}

function CollapsibleSection({ label, count, accent = 'blue', defaultOpen = false, children, headerExtra }: {
  label: string; count: number; accent?: 'blue' | 'red' | 'slate'; defaultOpen?: boolean
  children: ReactNode; headerExtra?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const labelCls = accent === 'red'
    ? 'text-red-500 dark:text-[#e8a045]'
    : accent === 'slate'
    ? 'text-slate-400 dark:text-white/30'
    : 'text-blue-500 dark:text-[#6498c8]'
  const countCls = accent === 'red'
    ? 'text-red-500 dark:text-[#e8a045] bg-red-50 dark:bg-[#e8a045]/[0.08]'
    : accent === 'slate'
    ? 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/[0.05]'
    : 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]'
  const chevronCls = accent === 'red' ? 'text-[#e8a045]/60' : accent === 'slate' ? 'text-slate-300 dark:text-white/20' : 'text-[#6498c8]/60'
  return (
    <div>
      <div className="flex items-center gap-1 px-4 py-1.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <span className={`text-[10px] font-bold uppercase tracking-wide flex-1 ${labelCls}`}>{label}</span>
          {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countCls}`}>{count}</span>}
          {open ? <ChevronUp size={11} className={chevronCls} /> : <ChevronDown size={11} className={chevronCls} />}
        </button>
        {headerExtra}
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

function ListNavItem({ l, active, indent = false }: { l: TodoList; active: boolean; indent?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/lists/${l.id}`)}
      className={`flex items-center gap-2 w-full py-1.5 transition-colors text-left ${indent ? 'pl-8 pr-4' : 'px-4'} ${
        active ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <List size={11} className={active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'} />
      <span className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}>{l.name}</span>
      <ArrowRight size={11} className="shrink-0 text-slate-300 dark:text-white/20" />
    </button>
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

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)

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
  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)
  const [newListFolderId, setNewListFolderId] = useState<string | undefined>()
  const [newListDueDate, setNewListDueDate] = useState<string | undefined>()
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFolders()
    loadLists()
  }, [loadFolders, loadLists])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

  const todayStr = useMemo(() => today().toString(), [])

  const adHocLists = useMemo(() => lists.filter((l) => !l.dueDate).sort((a, b) => a.order - b.order), [lists])
  const dateLists = useMemo(() => lists.filter((l) => !!l.dueDate), [lists])
  const overdueLists = useMemo(
    () => dateLists.filter((l) => l.dueDate! < todayStr).sort((a, b) => b.dueDate!.localeCompare(a.dueDate!)),
    [dateLists, todayStr]
  )
  const upcomingLists = useMemo(
    () => dateLists.filter((l) => l.dueDate! >= todayStr).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)),
    [dateLists, todayStr]
  )

  const standaloneLists = useMemo(() => adHocLists.filter((l) => !l.folderId), [adHocLists])
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders])

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
                <span className="text-[11px] font-bold text-blue-400 tabular-nums">{listCount}</span>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {rightOpen && (
            <>
              {/* Overdue date-based lists */}
              {overdueLists.length > 0 && (
                <div className="py-1">
                  <CollapsibleSection label="Overdue" count={overdueLists.length} accent="red" defaultOpen>
                    <ul className="flex flex-col gap-1 px-2 pb-1">
                      {overdueLists.map((l) => (
                        <li key={l.id}>
                          <button
                            onClick={() => navigate(`/lists/${l.id}`)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-colors ${
                              activeListId === l.id
                                ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
                                : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07]'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-semibold text-[#e8a045]/80 mb-0.5">{formatDate(l.dueDate!)}</div>
                              <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate">{l.name}</div>
                            </div>
                            <ArrowRight size={13} className="shrink-0 text-slate-300 dark:text-white/20" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                </div>
              )}

              {/* Upcoming date-based lists */}
              {upcomingLists.length > 0 && (
                <div className={`py-1 ${overdueLists.length > 0 ? 'border-t border-slate-200 dark:border-white/[0.07]' : ''}`}>
                  <CollapsibleSection label="Upcoming" count={upcomingLists.length} defaultOpen>
                    <ul className="flex flex-col gap-1 px-2 pb-1">
                      {upcomingLists.map((l) => (
                        <li key={l.id}>
                          <button
                            onClick={() => navigate(`/lists/${l.id}`)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-colors ${
                              activeListId === l.id
                                ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
                                : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07]'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-semibold text-[#6498c8]/80 mb-0.5">{formatDate(l.dueDate!)}</div>
                              <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate">{l.name}</div>
                            </div>
                            <ArrowRight size={13} className="shrink-0 text-slate-300 dark:text-white/20" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                </div>
              )}

              {/* Ad-hoc lists */}
              <div className={`py-1 ${dateLists.length > 0 ? 'border-t border-slate-200 dark:border-white/[0.07]' : ''}`}>
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
                      ><Plus size={11} /></button>
                      <button
                        onClick={() => { setEditingFolder(null); setFolderFormOpen(true) }}
                        className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        title="New folder"
                      ><FolderOpen size={11} /></button>
                    </div>
                  }
                >
                  {adHocLists.length === 0 && folders.length === 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No lists yet</p>
                  )}
                  {standaloneLists.map((l) => (
                    <ListNavItem key={l.id} l={l} active={activeListId === l.id} />
                  ))}
                  {sortedFolders.map((folder) => {
                    const folderLists = adHocLists.filter((l) => l.folderId === folder.id)
                    const collapsed = collapsedFolders.has(folder.id)
                    return (
                      <div key={folder.id}>
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          {collapsed
                            ? <ChevronRight size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
                            : <ChevronDown size={10} className="text-slate-300 dark:text-white/20 shrink-0" />}
                          <FolderOpen size={11} className="text-slate-400 dark:text-white/25 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wide truncate flex-1">{folder.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); openNewList({ folderId: folder.id }) }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                          ><Plus size={10} /></button>
                        </button>
                        {!collapsed && folderLists.map((l) => (
                          <ListNavItem key={l.id} l={l} active={activeListId === l.id} indent />
                        ))}
                      </div>
                    )
                  })}
                </CollapsibleSection>
              </div>

              {lists.length === 0 && folders.length === 0 && (
                <p className="text-[12px] text-slate-400 dark:text-white/25 text-center py-8 leading-relaxed">No lists yet</p>
              )}
            </>
          )}

          {!rightOpen && (
            <div className="flex flex-col items-center pt-3">
              <CheckSquare size={14} className="text-slate-300 dark:text-white/20" />
              {listCount > 0 && (
                <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-2">{listCount}</span>
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
          onSave={async (f) => { await saveFolder(f); setFolderFormOpen(false); setEditingFolder(null) }}
          onClose={() => { setFolderFormOpen(false); setEditingFolder(null) }}
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
          onClose={() => { setListFormOpen(false); setEditingList(null) }}
        />
      )}
    </>
  )
}
