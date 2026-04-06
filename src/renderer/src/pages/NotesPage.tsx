import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FolderOpen, Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { useNotesStore } from '../../store/notes.store'
import { useNoteFoldersStore } from '../../store/note_folders.store'
import type { NoteFolder } from '../../types/models'
import NoteFolderForm from '../notes/NoteFolderForm'
import NoteEditor from '../notes/NoteEditor'

export default function NotesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const notes = useNotesStore((s) => s.notes)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)

  const folders = useNoteFoldersStore((s) => s.folders)
  const loadFolders = useNoteFoldersStore((s) => s.load)
  const saveFolder = useNoteFoldersStore((s) => s.save)
  const removeFolder = useNoteFoldersStore((s) => s.remove)

  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null)

  const allNotes = Array.from(notes.values())
  const sortedFolders = [...folders].sort((a, b) => a.displayOrder - b.displayOrder)

  useEffect(() => {
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  function handleNewNote(folderId?: string) {
    const now = new Date()
    const note = {
      id: crypto.randomUUID(),
      content: '',
      folderId,
      displayOrder: allNotes.length,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
    saveNote(note)
    navigate(`/notes/${note.id}`)
  }

  function handleNewFolder() {
    setEditingFolder(null)
    setFolderFormOpen(true)
  }

  function handleEditFolder(folder: NoteFolder) {
    setEditingFolder(folder)
    setFolderFormOpen(true)
  }

  function handleDeleteFolder(id: string) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const folderNotes = allNotes.filter((n) => n.folderId === id)
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
    removeFolder(id)
  }

  const activeNoteId = location.pathname.match(/^\/notes\/([^/]+)$/)?.[1]
  const activeNote = activeNoteId ? notes.get(activeNoteId) : undefined

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-white/[0.07] bg-[var(--bg-app)] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.07]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h1>
            <button
              onClick={handleNewFolder}
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              title="New folder"
            >
              <FolderOpen size={16} />
            </button>
          </div>
          <button
            onClick={() => handleNewNote()}
            className="flex items-center justify-center gap-2 w-full text-sm font-medium text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white/90 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            New Note
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide mb-2 px-2">
              Folders
            </h2>
            {sortedFolders.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-white/25 px-2">No folders yet</p>
            )}
            {sortedFolders.map((folder) => {
              const folderNotes = allNotes.filter((n) => n.folderId === folder.id)
              return (
                <div key={folder.id} className="mb-1">
                  <button
                    onClick={() => handleNewNote(folder.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded transition-colors"
                  >
                    <FolderOpen size={14} className="text-slate-400 dark:text-white/30" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-slate-400 dark:text-white/25">
                      {folderNotes.length}
                    </span>
                  </button>
                  <div className="flex gap-0.5 ml-6 mt-0.5">
                    <button
                      onClick={() => handleEditFolder(folder)}
                      className="p-1 rounded text-slate-300 hover:text-slate-500 dark:hover:text-white/40 transition-colors"
                      title="Rename"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wide mb-2 px-2">
              All Notes
            </h2>
            <button
              onClick={() => handleNewNote()}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded transition-colors"
            >
              <FileText size={14} className="text-slate-400 dark:text-white/30" />
              <span className="flex-1">New note</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden bg-white dark:bg-[var(--bg-app)]">
        {activeNote ? (
          <NoteEditor
            note={activeNote}
            onChange={(note) => {
              saveNote(note)
              navigate(`/notes/${note.id}`)
            }}
            onDelete={(id) => {
              if (window.confirm('Delete this note?')) {
                deleteNote(id)
                navigate('/notes')
              }
            }}
            onBack={() => navigate('/notes')}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-white/10" />
              <p className="text-slate-500 dark:text-gray-400 mb-2">No note selected</p>
              <button
                onClick={() => handleNewNote()}
                className="text-blue-600 dark:text-[#6498c8] hover:underline"
              >
                Create a new note
              </button>
            </div>
          </div>
        )}
      </main>

      {folderFormOpen && (
        <NoteFolderForm
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
    </div>
  )
}
