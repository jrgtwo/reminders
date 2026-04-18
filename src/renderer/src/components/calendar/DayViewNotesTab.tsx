import { ArrowRight, Edit3, Trash2 } from 'lucide-react'
import type { Note } from '../../types/models'
import NoteEditor from '../notes/NoteEditor'

export default function DayViewNotesTab({
  dateStr,
  notes,
  editingNoteId,
  setEditingNoteId,
  saveNote,
  handleNewNote,
  handleDeleteNote,
}: {
  dateStr: string
  notes: Map<string, Note>
  editingNoteId: string | null
  setEditingNoteId: (id: string | null) => void
  saveNote: (note: Note) => void
  handleNewNote: () => void
  handleDeleteNote: (id: string, e: React.MouseEvent) => void
}) {
  const existingNotes = Array.from(notes.values()).filter((n) => n.date === dateStr)

  if (existingNotes.length === 0) {
    return (
      <div className="mb-8 min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-[13px] text-slate-400 dark:text-white/50 mb-4">
              No notes for this day yet.
            </p>
            <button
              onClick={handleNewNote}
              className="text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              + Create your first note
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 flex flex-col gap-2">
      <button
        onClick={handleNewNote}
        className="flex items-center gap-1.5 self-end text-[12px] font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity px-2 py-1 rounded-lg hover:bg-[var(--accent)]/[0.06]"
      >
        <span className="text-sm leading-none">+</span>
        Add Note
      </button>
      {existingNotes.map((note) => (
        <div
          key={note.id}
          className="bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] rounded-xl shadow-sm hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 btn-3d"
        >
          <button
            onClick={() => setEditingNoteId(note.id === editingNoteId ? null : note.id)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/[0.09] group"
          >
            <Edit3
              size={20}
              className={`shrink-0 transition-colors ${note.id === editingNoteId ? 'text-[var(--accent)]' : 'text-slate-400 dark:text-white/55'}`}
            />
            <div className="flex-1 min-w-0">
              {note.title ? (
                <div className="text-[14px] font-medium text-slate-800 dark:text-white/80 truncate">
                  {note.title}
                </div>
              ) : (
                <div className="text-[13px] text-slate-400 dark:text-white/55 italic">
                  Untitled
                </div>
              )}
              {note.content && (
                <div className="text-[12px] text-slate-400 dark:text-white/50 mt-0.5 truncate">
                  {note.content.replace(/[#*`>\[\]]/g, '').slice(0, 100)}
                  {note.content.length > 100 ? '...' : ''}
                </div>
              )}
            </div>
            <ArrowRight
              size={20}
              className={`shrink-0 text-slate-300 dark:text-white/50 transition-transform ${note.id === editingNoteId ? 'rotate-90' : ''}`}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteNote(note.id, e)
              }}
              className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete note"
            >
              <Trash2 size={20} />
            </button>
          </button>
          {note.id === editingNoteId && (
            <NoteEditor
              note={note}
              onChange={saveNote}
              onDelete={(e) => handleDeleteNote(note.id, e)}
              onBack={() => setEditingNoteId(null)}
            />
          )}
        </div>
      ))}
      <button
        onClick={handleNewNote}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[var(--accent)] dark:hover:border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)] text-[13px] font-medium transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add note
      </button>
    </div>
  )
}
