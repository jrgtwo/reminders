import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  List,
  FolderOpen,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useNotesStore } from '../../store/notes.store'
import { useNoteFoldersStore } from '../../store/note_folders.store'
import { useUIStore } from '../../store/ui.store'

import type { TodoFolder, TodoList, Note } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'
import NoteFolderForm from '../notes/NoteFolderForm'

// --- Date hierarchy helpers ---
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

type DayMap = Record<string, TodoList[]>
type MonthMap = Record<string, DayMap>
type YearMap = Record<string, MonthMap>

type NoteDayMap = Record<string, Note[]>
type NoteMonthMap = Record<string, NoteDayMap>
type NoteYearMap = Record<string, NoteMonthMap>

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

function buildNoteDateTree(notes: Note[]): NoteYearMap {
  const tree: NoteYearMap = {}
  for (const n of notes) {
    if (!n.date) continue
    const [year, month, day] = n.date.split('-')
    if (!tree[year]) tree[year] = {}
    if (!tree[year][month]) tree[year][month] = {}
    if (!tree[year][month][day]) tree[year][month][day] = []
    tree[year][month][day].push(n)
  }
  return tree
}

function CollapsibleSection({
  label,
  count,
  accent = 'blue',
  defaultOpen = false,
  children,
  headerExtra
}: {
  label: string
  count: number
  accent?: 'blue' | 'red' | 'slate'
  defaultOpen?: boolean
  children: ReactNode
  headerExtra?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const labelCls =
    accent === 'red'
      ? 'text-red-500 dark:text-[#e8a045]'
      : accent === 'slate'
        ? 'text-slate-400 dark:text-white/30'
        : 'text-blue-500 dark:text-[#6498c8]'
  const countCls =
    accent === 'red'
      ? 'text-red-500 dark:text-[#e8a045] bg-red-50 dark:bg-[#e8a045]/[0.08]'
      : accent === 'slate'
        ? 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/[0.05]'
        : 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]'
  const chevronCls =
    accent === 'red'
      ? 'text-[#e8a045]/60'
      : accent === 'slate'
        ? 'text-slate-300 dark:text-white/20'
        : 'text-[#6498c8]/60'
  return (
    <div>
      <div className="flex items-center gap-1 px-4 py-1.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <span className={`text-[10px] font-bold uppercase tracking-wide flex-1 ${labelCls}`}>
            {label}
          </span>
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countCls}`}>
              {count}
            </span>
          )}
          {open ? (
            <ChevronUp size={11} className={chevronCls} />
          ) : (
            <ChevronDown size={11} className={chevronCls} />
          )}
        </button>
        {headerExtra}
      </div>
      {open && <div className="animate-in fade-in duration-200">{children}</div>}
    </div>
  )
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
                              <ListNavItem key={l.id} l={l} active={activeListId === l.id} indent onDelete={onDeleteList} />
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

function DateNoteSection({
  notes,
  activeNoteId,
  onNewNoteForDate,
  onDeleteNote
}: {
  notes: Note[]
  activeNoteId?: string
  onNewNoteForDate: (date: string) => void
  onDeleteNote: (id: string) => void
}) {
  const tree = useMemo(() => buildNoteDateTree(notes), [notes])
  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set())
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  if (years.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
        No date-based notes yet
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
                        const dayNotes = tree[year][month][day]
                        const dateStr = `${year}-${month}-${day}`
                        return (
                          <div key={day}>
                            <div className="flex items-center pl-10 pr-4 py-0.5">
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-white/25 flex-1">
                                {parseInt(day, 10)}
                              </span>
                              <button
                                onClick={() => onNewNoteForDate(dateStr)}
                                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                                title={`New note for ${dateStr}`}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            {dayNotes.map((n) => (
                              <NoteNavItem
                                key={n.id}
                                n={n}
                                active={activeNoteId === n.id}
                                indent
                                onDelete={onDeleteNote}
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

function ListNavItem({
  l,
  active,
  indent = false,
  onDelete
}: {
  l: TodoList
  active: boolean
  indent?: boolean
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  return (
    <div
      className={`group flex items-center gap-2 w-full py-1.5 transition-colors ${indent ? 'pl-8 pr-2' : 'pl-4 pr-2'} ${
        active
          ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <button
        onClick={() => navigate(`/lists/${l.id}`)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <List
          size={11}
          className={
            active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'
          }
        />
        <span
          className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}
        >
          {l.name}
        </span>
      </button>
      <button
        onClick={() => onDelete(l.id)}
        className="shrink-0 p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete list"
      >
        <Trash2 size={9} />
      </button>
    </div>
  )
}

function NoteNavItem({
  n,
  active,
  indent = false,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  n: Note
  active: boolean
  indent?: boolean
  onDelete: (id: string) => void
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
}) {
  const navigate = useNavigate()
  const title = n.title || 'Untitled'
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => { e.dataTransfer.setData('noteId', n.id); onDragStart?.(n.id) }}
      onDragEnd={() => onDragEnd?.()}
      className={`group flex items-center gap-2 w-full py-1.5 transition-colors ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''} ${indent ? 'pl-8 pr-2' : 'pl-4 pr-2'} ${
        active
          ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <button
        onClick={() => navigate(`/notes/${n.id}`)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <FileText
          size={11}
          className={
            active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'
          }
        />
        <span
          className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}
        >
          {title}
        </span>
      </button>
      <button
        onClick={() => onDelete(n.id)}
        className="shrink-0 p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete note"
      >
        <Trash2 size={9} />
      </button>
    </div>
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

  const noteFolders = useNoteFoldersStore((s) => s.folders)
  const loadNoteFolders = useNoteFoldersStore((s) => s.load)
  const saveNoteFolder = useNoteFoldersStore((s) => s.save)
  const removeNoteFolder = useNoteFoldersStore((s) => s.remove)

  const allNotes = useNotesStore((s) => s.notes)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)

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
  const [collapsedNoteFolders, setCollapsedNoteFolders] = useState<Set<string>>(new Set())
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [noteDropTarget, setNoteDropTarget] = useState<string | 'standalone' | null>(null)
  const [noteFolderFormOpen, setNoteFolderFormOpen] = useState(false)
  const [editingNoteFolder, setEditingNoteFolder] = useState<
    import('../../types/models').NoteFolder | null
  >(null)

  useEffect(() => {
    loadFolders()
    loadLists()
    loadNoteFolders()
    loadNotes()
  }, [loadFolders, loadLists, loadNoteFolders, loadNotes])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined
  const activeNoteId = location.pathname.startsWith('/notes/')
    ? location.pathname.split('/notes/')[1]?.split('/')[0]
    : undefined

  const adHocLists = useMemo(
    () => lists.filter((l) => !l.dueDate).sort((a, b) => a.order - b.order),
    [lists]
  )
  const dateLists = useMemo(() => lists.filter((l) => !!l.dueDate), [lists])

  const standaloneLists = useMemo(() => adHocLists.filter((l) => !l.folderId), [adHocLists])
  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.displayOrder - b.displayOrder),
    [folders]
  )

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleNoteFolder(id: string) {
    setCollapsedNoteFolders((prev) => {
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

  const noteCount = allNotes.size

  const standaloneNotes = useMemo(
    () =>
      Array.from(allNotes.values())
        .filter((n) => !n.folderId && !n.date)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [allNotes]
  )
  const dateNotes = useMemo(
    () => Array.from(allNotes.values()).filter((n) => !!n.date),
    [allNotes]
  )

  function handleDeleteFolder(id: string) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const folderLists = adHocLists.filter((l) => l.folderId === id)
    if (folderLists.length > 0) {
      if (
        !window.confirm(
          `This folder has ${folderLists.length} list(s). Delete the folder? Lists will become standalone.`
        )
      ) {
        return
      }
    }
    removeFolder(id)
  }

  function openNewNoteFolder() {
    setEditingNoteFolder(null)
    setNoteFolderFormOpen(true)
  }

  function openEditNoteFolder(folder: import('../../types/models').NoteFolder) {
    setEditingNoteFolder(folder)
    setNoteFolderFormOpen(true)
  }

  function handleDeleteNoteFolder(id: string) {
    const folder = noteFolders.find((f) => f.id === id)
    if (!folder) return
    const folderNotes = Array.from(allNotes.values()).filter((n) => n.folderId === id)
    if (folderNotes.length > 0) {
      if (
        !window.confirm(
          `This folder has ${folderNotes.length} note(s). Delete the folder and all its notes?`
        )
      ) {
        return
      }
      folderNotes.forEach((n) => deleteNote(n.id))
    }
    removeNoteFolder(id)
  }

  function handleNoteDrop(targetFolderId: string | undefined) {
    if (!draggingNoteId) return
    const note = allNotes.get(draggingNoteId)
    if (!note || note.folderId === targetFolderId) return
    saveNote({ ...note, folderId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingNoteId(null)
    setNoteDropTarget(null)
  }

  function handleDeleteList(id: string) {
    removeList(id)
  }

  function handleDeleteNote(id: string) {
    deleteNote(id)
  }

  function handleNewNote(folderId?: string) {
    const now = new Date()
    const note = {
      id: crypto.randomUUID(),
      content: '',
      folderId,
      displayOrder: allNotes.size,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    saveNote(note)
    navigate(`/notes/${note.id}`)
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
                  {standaloneLists.map((l) => (
                    <ListNavItem key={l.id} l={l} active={activeListId === l.id} onDelete={handleDeleteList} />
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
                          {collapsed ? (
                            <ChevronRight
                              size={10}
                              className="text-slate-300 dark:text-white/20 shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={10}
                              className="text-slate-300 dark:text-white/20 shrink-0"
                            />
                          )}
                          <FolderOpen
                            size={11}
                            className="text-blue-400 dark:text-blue-500/70 shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wide truncate flex-1 text-left">
                            {folder.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingFolder(folder)
                              setFolderFormOpen(true)
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title="Rename folder"
                          >
                            <Pencil size={9} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder.id)
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
                            title="Delete folder"
                          >
                            <Trash2 size={9} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openNewList({ folderId: folder.id })
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title="New list in folder"
                          >
                            <Plus size={10} />
                          </button>
                        </button>
                        {!collapsed &&
                          folderLists.map((l) => (
                            <ListNavItem key={l.id} l={l} active={activeListId === l.id} indent onDelete={handleDeleteList} />
                          ))}
                      </div>
                    )
                  })}
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
                <CollapsibleSection
                  label="Notes"
                  count={noteCount}
                  accent="blue"
                  defaultOpen={false}
                  headerExtra={
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleNewNote(undefined)}
                        className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        title="New note"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={openNewNoteFolder}
                        className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        title="New folder"
                      >
                        <FolderOpen size={11} />
                      </button>
                    </div>
                  }
                >
                  {noteCount === 0 && noteFolders.length === 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
                      No notes yet
                    </p>
                  )}

                  {/* Standalone ad-hoc notes (no folder, no date) */}
                  <div
                    onDragOver={(e) => { if (draggingNoteId) { e.preventDefault(); setNoteDropTarget('standalone') } }}
                    onDragLeave={() => setNoteDropTarget(null)}
                    onDrop={(e) => { e.preventDefault(); handleNoteDrop(undefined) }}
                    className={`transition-colors rounded mx-1 ${noteDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
                  >
                    {standaloneNotes.map((n) => (
                      <NoteNavItem key={n.id} n={n} active={activeNoteId === n.id} onDelete={handleDeleteNote} onDragStart={setDraggingNoteId} onDragEnd={() => { setDraggingNoteId(null); setNoteDropTarget(null) }} />
                    ))}
                    {noteDropTarget === 'standalone' && standaloneNotes.length === 0 && (
                      <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">Drop here to remove from folder</p>
                    )}
                  </div>

                  {/* Folder groups */}
                  {noteFolders.map((folder) => {
                    const folderNotes = Array.from(allNotes.values()).filter(
                      (n) => n.folderId === folder.id
                    )
                    const collapsed = collapsedNoteFolders.has(folder.id)
                    const isDropTarget = noteDropTarget === folder.id
                    return (
                      <div
                        key={folder.id}
                        onDragOver={(e) => { if (draggingNoteId) { e.preventDefault(); setNoteDropTarget(folder.id) } }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setNoteDropTarget(null) }}
                        onDrop={(e) => { e.preventDefault(); handleNoteDrop(folder.id) }}
                        className={`rounded mx-1 transition-colors ${isDropTarget ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
                      >
                        <div
                          onClick={() => toggleNoteFolder(folder.id)}
                          className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer rounded"
                        >
                          {collapsed ? (
                            <ChevronRight
                              size={10}
                              className="text-slate-300 dark:text-white/20 shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={10}
                              className="text-slate-300 dark:text-white/20 shrink-0"
                            />
                          )}
                          <FolderOpen
                            size={11}
                            className={`shrink-0 transition-colors ${isDropTarget ? 'text-[#6498c8]' : 'text-blue-400 dark:text-blue-500/70'}`}
                          />
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wide truncate flex-1 text-left">
                            {folder.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditNoteFolder(folder)
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title="Rename folder"
                          >
                            <Pencil size={9} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNoteFolder(folder.id)
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
                            title="Delete folder"
                          >
                            <Trash2 size={9} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNewNote(folder.id)
                            }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title="New note in folder"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        {!collapsed &&
                          folderNotes.map((n) => (
                            <NoteNavItem key={n.id} n={n} active={activeNoteId === n.id} indent onDelete={handleDeleteNote} onDragStart={setDraggingNoteId} onDragEnd={() => { setDraggingNoteId(null); setNoteDropTarget(null) }} />
                          ))}
                      </div>
                    )
                  })}

                  {/* By Date section */}
                  {dateNotes.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
                      <CollapsibleSection
                        label="By Date"
                        count={dateNotes.length}
                        accent="slate"
                        defaultOpen={false}
                        headerExtra={
                          <button
                            onClick={() => handleNewNote()}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title="New date-based note"
                          >
                            <Plus size={11} />
                          </button>
                        }
                      >
                        <DateNoteSection
                          notes={dateNotes}
                          activeNoteId={activeNoteId}
                          onNewNoteForDate={(date) => {
                            const now = new Date()
                            const note = {
                              id: crypto.randomUUID(),
                              content: '',
                              date,
                              displayOrder: allNotes.size,
                              createdAt: now.toISOString(),
                              updatedAt: now.toISOString()
                            }
                            saveNote(note)
                            navigate(`/notes/${note.id}`)
                          }}
                          onDeleteNote={handleDeleteNote}
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
          onSave={async (f) => {
            await saveFolder(f)
            setFolderFormOpen(false)
            setEditingFolder(null)
          }}
          onClose={() => {
            setFolderFormOpen(false)
            setEditingFolder(null)
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

      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={editingNoteFolder}
          onSave={async (f) => {
            await saveNoteFolder(f)
            setNoteFolderFormOpen(false)
            setEditingNoteFolder(null)
          }}
          onClose={() => {
            setNoteFolderFormOpen(false)
            setEditingNoteFolder(null)
          }}
        />
      )}
    </>
  )
}
