import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useNotesStore } from '../../../store/notes.store'
import { useNoteFoldersStore } from '../../../store/note_folders.store'
import type { Note } from '../../../types/models'

const DEBOUNCE_MS = 800

export function useNoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const notes = useNotesStore((s) => s.notes)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const loadFolders = useNoteFoldersStore((s) => s.load)

  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const stored = id ? notes.get(id) : undefined
  const [draft, setDraft] = useState<Note | null>(() => {
    const s = (location.state as { draftNote?: Note } | null)?.draftNote
    return s && s.id === id ? s : null
  })

  useEffect(() => {
    const s = (location.state as { draftNote?: Note } | null)?.draftNote
    setDraft(s && s.id === id ? s : null)
  }, [id, location.state])

  const note = stored ?? draft ?? undefined

  useEffect(() => {
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function persist(updated: Note) {
    await saveNote(updated)
    if (draft && draft.id === updated.id) setDraft(null)
  }

  function handleContentChange(markdown: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!note) return
      persist({ ...note, content: markdown, updatedAt: new Date().toISOString() })
    }, DEBOUNCE_MS)
  }

  function handleTitleChange(newTitle: string) {
    if (!note) return
    setSaving(true)
    persist({
      ...note,
      title: newTitle || undefined,
      updatedAt: new Date().toISOString(),
    }).finally(() => setSaving(false))
  }

  function handleFolderChange(folderId: string | undefined) {
    if (!note) return
    persist({
      ...note,
      folderId,
      updatedAt: new Date().toISOString(),
    })
  }

  function handleDelete() {
    if (!note || !id) return
    if (draft && draft.id === id) {
      setDraft(null)
    } else {
      deleteNote(id)
    }
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
