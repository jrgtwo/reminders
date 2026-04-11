import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNotesStore } from '../../../store/notes.store'
import { useNoteFoldersStore } from '../../../store/note_folders.store'

const DEBOUNCE_MS = 800

export function useNoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notes = useNotesStore((s) => s.notes)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const loadFolders = useNoteFoldersStore((s) => s.load)

  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const note = id ? notes.get(id) : undefined

  const noteRef = useRef(note)
  noteRef.current = note

  useEffect(() => {
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  // Clean up empty notes when navigating away without entering content
  useEffect(() => {
    return () => {
      const current = noteRef.current
      if (current && !current.title && !current.content.trim()) {
        deleteNote(current.id)
      }
    }
  }, [id, deleteNote])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleContentChange(markdown: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!note) return
      saveNote({ ...note, content: markdown, updatedAt: new Date().toISOString() })
    }, DEBOUNCE_MS)
  }

  function handleTitleChange(newTitle: string) {
    if (!note) return
    setSaving(true)
    saveNote({
      ...note,
      title: newTitle || undefined,
      updatedAt: new Date().toISOString(),
    }).finally(() => setSaving(false))
  }

  function handleFolderChange(folderId: string | undefined) {
    if (!note) return
    saveNote({
      ...note,
      folderId,
      updatedAt: new Date().toISOString(),
    })
  }

  function handleDelete() {
    if (!note || !id) return
    deleteNote(id)
    navigate('/notes')
  }

  const folders = useNoteFoldersStore((s) => s.folders)

  return {
    id,
    note,
    saving,
    folders,
    deleteDialogOpen,
    setDeleteDialogOpen,
    navigate,
    handleContentChange,
    handleTitleChange,
    handleFolderChange,
    handleDelete,
  }
}
