import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  FolderOpen,
  FolderPlus,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotesStore } from '../../store/notes.store'
import { useNoteFoldersStore } from '../../store/note_folders.store'
import { buildFolderTree, getDescendantIds } from '../../lib/folderTree'
import type { Note, NoteFolder } from '../../types/models'
import NoteFolderForm from './NoteFolderForm'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

type NoteDayMap = Record<string, Note[]>
type NoteMonthMap = Record<string, NoteDayMap>
type NoteYearMap = Record<string, NoteMonthMap>

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
  defaultOpen = true,
  children,
  headerExtra
}: {
  label: string
  count: number
  accent?: 'blue' | 'slate'
  defaultOpen?: boolean
  children: ReactNode
  headerExtra?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const labelCls =
    accent === 'slate'
      ? 'text-slate-400 dark:text-white/30'
      : 'text-blue-500 dark:text-[#6498c8]'
  const countCls =
    accent === 'slate'
      ? 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/[0.05]'
      : 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]'
  const chevronCls = accent === 'slate' ? 'text-slate-300 dark:text-white/20' : 'text-[#6498c8]/60'
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

function NoteNavItem({
  n,
  active,
  indent = false,
  onDelete,
  onDragStart,
  onDragEnd
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
      onDragStart={(e) => {
        e.dataTransfer.setData('noteId', n.id)
        onDragStart?.(n.id)
      }}
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
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

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
                        const dayKey = `${year}-${month}-${day}`
                        const dayCollapsed = collapsedDays.has(dayKey)
                        return (
                          <div key={day}>
                            <div className="flex items-center pl-8 pr-4 py-0.5">
                              <button
                                onClick={() =>
                                  setCollapsedDays((prev) => {
                                    const next = new Set(prev)
                                    next.has(dayKey) ? next.delete(dayKey) : next.add(dayKey)
                                    return next
                                  })
                                }
                                className="flex items-center gap-1.5 flex-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                              >
                                {dayCollapsed ? (
                                  <ChevronRight size={9} className="text-slate-300 dark:text-white/20 shrink-0" />
                                ) : (
                                  <ChevronDown size={9} className="text-slate-300 dark:text-white/20 shrink-0" />
                                )}
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-white/25">
                                  {parseInt(day, 10)}
                                </span>
                              </button>
                              <button
                                onClick={() => onNewNoteForDate(dateStr)}
                                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                                title={`New note for ${dateStr}`}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            {!dayCollapsed && dayNotes.map((n) => (
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

export default function NotesNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const noteFolders = useNoteFoldersStore((s) => s.folders)
  const loadNoteFolders = useNoteFoldersStore((s) => s.load)
  const saveNoteFolder = useNoteFoldersStore((s) => s.save)
  const removeNoteFolder = useNoteFoldersStore((s) => s.remove)

  const allNotes = useNotesStore((s) => s.notes)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [noteDropTarget, setNoteDropTarget] = useState<string | 'standalone' | null>(null)
  const [noteFolderFormOpen, setNoteFolderFormOpen] = useState(false)
  const [editingNoteFolder, setEditingNoteFolder] = useState<NoteFolder | null>(null)
  const [pendingParentNoteFolderId, setPendingParentNoteFolderId] = useState<string | undefined>()
  const [collapsedNoteFolders, setCollapsedNoteFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadNoteFolders()
    loadNotes()
  }, [loadNoteFolders, loadNotes])

  const activeNoteId = location.pathname.startsWith('/notes/')
    ? location.pathname.split('/notes/')[1]?.split('/')[0]
    : undefined

  const noteFolderChildrenMap = useMemo(() => buildFolderTree(noteFolders), [noteFolders])
  const rootNoteFolders = useMemo(
    () =>
      (noteFolderChildrenMap.get(undefined) ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder
      ),
    [noteFolderChildrenMap]
  )

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

  function toggleNoteFolder(id: string) {
    setCollapsedNoteFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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

  function handleDeleteNote(id: string) {
    deleteNote(id)
  }

  function handleDeleteNoteFolder(id: string) {
    const folder = noteFolders.find((f) => f.id === id)
    if (!folder) return
    const descendantIds = getDescendantIds(id, noteFolderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedNotes = Array.from(allNotes.values()).filter(
      (n) => n.folderId && allFolderIds.has(n.folderId)
    )
    if (affectedNotes.length > 0 || descendantIds.size > 0) {
      const msg = [
        descendantIds.size > 0 ? `${descendantIds.size} subfolder(s)` : '',
        affectedNotes.length > 0 ? `${affectedNotes.length} note(s)` : ''
      ]
        .filter(Boolean)
        .join(' and ')
      if (!window.confirm(`This folder contains ${msg}. Delete everything?`)) return
      affectedNotes.forEach((n) => deleteNote(n.id))
    }
    allFolderIds.forEach((fid) => removeNoteFolder(fid))
  }

  function handleNoteDrop(targetFolderId: string | undefined) {
    if (!draggingNoteId) return
    const note = allNotes.get(draggingNoteId)
    if (!note || note.folderId === targetFolderId) return
    saveNote({ ...note, folderId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingNoteId(null)
    setNoteDropTarget(null)
  }

  function renderNoteFolder(folder: NoteFolder, depth: number): ReactNode {
    const folderNotes = Array.from(allNotes.values()).filter((n) => n.folderId === folder.id)
    const collapsed = collapsedNoteFolders.has(folder.id)
    const isDropTarget = noteDropTarget === folder.id
    const children = (noteFolderChildrenMap.get(folder.id) ?? []).sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
    const pl = 16 + depth * 12
    return (
      <div
        key={folder.id}
        onDragOver={(e) => {
          if (draggingNoteId) {
            e.preventDefault()
            setNoteDropTarget(folder.id)
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setNoteDropTarget(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          handleNoteDrop(folder.id)
        }}
        className={`rounded mx-1 transition-colors ${isDropTarget ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
      >
        <div
          onClick={() => toggleNoteFolder(folder.id)}
          className="flex items-center gap-1.5 w-full py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer rounded"
          style={{ paddingLeft: `${pl}px`, paddingRight: '8px' }}
        >
          {collapsed ? (
            <ChevronRight size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
          ) : (
            <ChevronDown size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
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
              setEditingNoteFolder(folder)
              setNoteFolderFormOpen(true)
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
              setEditingNoteFolder(null)
              setPendingParentNoteFolderId(folder.id)
              setNoteFolderFormOpen(true)
            }}
            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
            title="New subfolder"
          >
            <FolderPlus size={9} />
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
        {!collapsed && (
          <>
            {folderNotes.map((n) => (
              <NoteNavItem
                key={n.id}
                n={n}
                active={activeNoteId === n.id}
                indent
                onDelete={handleDeleteNote}
                onDragStart={setDraggingNoteId}
                onDragEnd={() => {
                  setDraggingNoteId(null)
                  setNoteDropTarget(null)
                }}
              />
            ))}
            {children.map((child) => renderNoteFolder(child, depth + 1))}
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <CollapsibleSection
        label="Notes"
        count={noteCount}
        accent="blue"
        defaultOpen={true}
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
              onClick={() => {
                setEditingNoteFolder(null)
                setPendingParentNoteFolderId(undefined)
                setNoteFolderFormOpen(true)
              }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New folder"
            >
              <FolderOpen size={11} />
            </button>
          </div>
        }
      >
        {noteCount === 0 && noteFolders.length === 0 && (
          <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No notes yet</p>
        )}

        {/* Standalone notes (no folder, no date) */}
        <div
          onDragOver={(e) => {
            if (draggingNoteId) {
              e.preventDefault()
              setNoteDropTarget('standalone')
            }
          }}
          onDragLeave={() => setNoteDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault()
            handleNoteDrop(undefined)
          }}
          className={`transition-colors rounded mx-1 ${noteDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
        >
          {standaloneNotes.map((n) => (
            <NoteNavItem
              key={n.id}
              n={n}
              active={activeNoteId === n.id}
              onDelete={handleDeleteNote}
              onDragStart={setDraggingNoteId}
              onDragEnd={() => {
                setDraggingNoteId(null)
                setNoteDropTarget(null)
              }}
            />
          ))}
          {noteDropTarget === 'standalone' && standaloneNotes.length === 0 && (
            <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">
              Drop here to remove from folder
            </p>
          )}
        </div>

        {/* Folder groups */}
        {rootNoteFolders.map((folder) => renderNoteFolder(folder, 0))}

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

      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={editingNoteFolder}
          parentId={pendingParentNoteFolderId}
          onSave={async (f) => {
            await saveNoteFolder(f)
            setNoteFolderFormOpen(false)
            setEditingNoteFolder(null)
            setPendingParentNoteFolderId(undefined)
          }}
          onClose={() => {
            setNoteFolderFormOpen(false)
            setEditingNoteFolder(null)
            setPendingParentNoteFolderId(undefined)
          }}
        />
      )}
    </>
  )
}
