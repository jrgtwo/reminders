import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, FolderOpen, Plus, Calendar } from 'lucide-react'
import { useNotesStore } from '../../store/notes.store'
import { useNoteFoldersStore } from '../../store/note_folders.store'
import type { Note, NoteFolder } from '../../types/models'
import Button from '../ui/Button'
import NoteFolderForm from '../notes/NoteFolderForm'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 7) {
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

function NoteListItem({ note, onClick }: { note: Note; onClick: (id: string) => void }) {
  const title = note.title || 'Untitled'
  const preview = note.content.slice(0, 100).replace(/\n/g, ' ')
  return (
    <button
      onClick={() => onClick(note.id)}
      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex items-start gap-2">
        <FileText size={14} className="text-slate-400 dark:text-white/25 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-[#6498c8]">
              {title}
            </h3>
            {note.date && (
              <span className="text-[10px] text-slate-400 dark:text-white/30 shrink-0">
                {note.date}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 line-clamp-2">
            {preview || 'No content'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {note.folderId && (
              <span className="text-[10px] text-slate-400 dark:text-white/30 flex items-center gap-0.5">
                <FolderOpen size={8} />
                Folder note
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-white/30">
              {formatRelativeTime(note.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function FolderItem({
  folder,
  notes,
  onClick
}: {
  folder: NoteFolder
  notes: Note[]
  onClick: (folderId: string) => void
}) {
  return (
    <button
      onClick={() => onClick(folder.id)}
      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex items-start gap-2">
        <FolderOpen size={14} className="text-[#6498c8] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-[#6498c8]">
            {folder.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </button>
  )
}

function DateGroup({
  date,
  notes,
  onClick
}: {
  date: string
  notes: Note[]
  onClick: (date: string) => void
}) {
  const day = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <button
      onClick={() => onClick(date)}
      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex items-start gap-2">
        <Calendar size={14} className="text-slate-400 dark:text-white/25 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-[#6498c8]">
            {day}
          </h3>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{date}</p>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function NotesPage() {
  const navigate = useNavigate()
  const notes = useNotesStore((s) => s.notes)
  const folders = useNoteFoldersStore((s) => s.folders)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const loadFolders = useNoteFoldersStore((s) => s.load)
  const [noteFolderFormOpen, setNoteFolderFormOpen] = useState(false)

  useEffect(() => {
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.displayOrder - b.displayOrder),
    [folders]
  )

  const adHocNotes = useMemo(
    () => Array.from(notes.values()).filter((n) => n.folderId && !n.date),
    [notes]
  )

  const dateBasedNotes = useMemo(
    () => Array.from(notes.values()).filter((n) => n.date && !n.folderId),
    [notes]
  )

  const notesByFolder = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const note of adHocNotes) {
      if (!note.folderId) continue
      const existing = map.get(note.folderId) || []
      existing.push(note)
      map.set(
        note.folderId,
        existing.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      )
    }
    return map
  }, [adHocNotes])

  const notesByDate = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const note of dateBasedNotes) {
      if (!note.date) continue
      const existing = map.get(note.date) || []
      existing.push(note)
      map.set(
        note.date,
        existing.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      )
    }
    return map
  }, [dateBasedNotes])

  const recentNotes = useMemo(
    () =>
      Array.from(notes.values())
        .filter((n) => !n.date || n.folderId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10),
    [notes]
  )

  const totalNotes = notes.size

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)]">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.07]">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Notes</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-white/40">{totalNotes} notes</span>
          <button
            onClick={() => {
              navigate('/notes')
              setNoteFolderFormOpen(true)
            }}
            className="p-2 rounded-lg text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-white/60 transition-colors"
            title="New folder"
          >
            <FolderOpen size={16} />
          </button>
          <button
            onClick={() => navigate('/notes/new')}
            className="p-2 rounded-lg bg-[#6498c8] text-white hover:bg-[#5a8ab8] transition-colors"
            title="New note"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Folders */}
          {sortedFolders.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide mb-2">
                Folders
              </h2>
              <div className="space-y-1">
                {sortedFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    notes={notesByFolder.get(folder.id) || []}
                    onClick={(folderId) => navigate(`/notes/folder/${folderId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent notes */}
          {recentNotes.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide mb-2">
                Recent
              </h2>
              <div className="space-y-1">
                {recentNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    onClick={(id) => navigate(`/notes/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Date-based notes */}
          {Array.from(notesByDate.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 10).length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide mb-2">
                By Date
              </h2>
              <div className="space-y-1">
                {Array.from(notesByDate.entries())
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .slice(0, 10)
                  .map(([date, dateNotes]) => (
                    <DateGroup
                      key={date}
                      date={date}
                      notes={dateNotes}
                      onClick={(d) => navigate(`/day/${d}`)}
                    />
                  ))}
              </div>
            </div>
          )}

          {totalNotes === 0 && (
            <div className="text-center py-12">
              <FileText size={32} className="text-slate-300 dark:text-white/15 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-white/40 mb-4">
                No notes yet. Create your first note to get started.
              </p>
              <Button onClick={() => navigate('/notes/new')} variant="primary">
                <Plus size={14} className="mr-1" />
                New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={null}
          onSave={async (folder) => {
            await loadFolders().then(() => folder.id)
            setNoteFolderFormOpen(false)
          }}
          onClose={() => setNoteFolderFormOpen(false)}
        />
      )}
    </div>
  )
}
