import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotesStore } from '../../../store/notes.store'
import { useNoteFoldersStore } from '../../../store/note_folders.store'
import { buildFolderTree, getDescendantIds } from '../../../lib/folderTree'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { NoteFolder } from '../../../types/models'

export function useNotesNav() {
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
  const [draggingNoteFolderId, setDraggingNoteFolderId] = useState<string | null>(null)
  const [noteFolderFormOpen, setNoteFolderFormOpen] = useState(false)
  const [editingNoteFolder, setEditingNoteFolder] = useState<NoteFolder | null>(null)
  const [pendingParentNoteFolderId, setPendingParentNoteFolderId] = useState<string | undefined>()
  const [expandedNoteFolders, setExpandedNoteFolders] = useState<Set<string>>(new Set())

  const noteDelete = useConfirmDelete(useCallback((id: string) => {
    deleteNote(id)
  }, [deleteNote]))

  const noteFolderChildrenMap = useMemo(() => buildFolderTree(noteFolders), [noteFolders])

  const folderDelete = useConfirmDelete(useCallback((id: string) => {
    const descendantIds = getDescendantIds(id, noteFolderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedNotes = Array.from(allNotes.values()).filter(
      (n) => n.folderId && allFolderIds.has(n.folderId)
    )
    affectedNotes.forEach((n) => deleteNote(n.id))
    allFolderIds.forEach((fid) => removeNoteFolder(fid))
  }, [allNotes, deleteNote, removeNoteFolder, noteFolderChildrenMap]))

  useEffect(() => {
    loadNoteFolders()
    loadNotes()
  }, [loadNoteFolders, loadNotes])

  const activeNoteId = location.pathname.startsWith('/notes/')
    ? location.pathname.split('/notes/')[1]?.split('/')[0]
    : undefined

  const rootNoteFolders = useMemo(
    () => (noteFolderChildrenMap.get(undefined) ?? []).sort((a, b) => a.displayOrder - b.displayOrder),
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
  const dateNotes = useMemo(() => Array.from(allNotes.values()).filter((n) => !!n.date), [allNotes])

  function toggleNoteFolder(id: string) {
    setExpandedNoteFolders((prev) => {
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
      updatedAt: now.toISOString(),
    }
    navigate(`/notes/${note.id}`, { state: { draftNote: note } })
  }

  function handleNewNoteForDate(date: string) {
    const now = new Date()
    const note = {
      id: crypto.randomUUID(),
      content: '',
      date,
      displayOrder: allNotes.size,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    navigate(`/notes/${note.id}`, { state: { draftNote: note } })
  }

  function handleDeleteNote(id: string, rect: DOMRect) {
    noteDelete.requestDelete(id, rect, 'Are you sure you want to delete this note? This cannot be undone.')
  }

  function handleDeleteNoteFolder(id: string, rect: DOMRect) {
    const descendantIds = getDescendantIds(id, noteFolderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedNotes = Array.from(allNotes.values()).filter(
      (n) => n.folderId && allFolderIds.has(n.folderId)
    )
    let msg = 'Delete this folder? This cannot be undone.'
    if (affectedNotes.length > 0 || descendantIds.size > 0) {
      const parts = [
        descendantIds.size > 0 ? `${descendantIds.size} subfolder(s)` : '',
        affectedNotes.length > 0 ? `${affectedNotes.length} note(s)` : '',
      ]
        .filter(Boolean)
        .join(' and ')
      msg = `This folder contains ${parts}. Delete everything?`
    }
    folderDelete.requestDelete(id, rect, msg)
  }

  function handleNoteDrop(targetFolderId: string | undefined) {
    if (!draggingNoteId) return
    const note = allNotes.get(draggingNoteId)
    if (!note || note.folderId === targetFolderId) return
    saveNote({ ...note, folderId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingNoteId(null)
    setNoteDropTarget(null)
  }

  function handleNoteFolderDrop(targetFolderId: string | undefined) {
    if (!draggingNoteFolderId) return
    if (draggingNoteFolderId === targetFolderId) return
    const folder = noteFolders.find((f) => f.id === draggingNoteFolderId)
    if (!folder || folder.parentId === targetFolderId) return
    if (targetFolderId) {
      const descendantIds = getDescendantIds(draggingNoteFolderId, noteFolderChildrenMap)
      if (descendantIds.has(targetFolderId)) return
    }
    saveNoteFolder({ ...folder, parentId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingNoteFolderId(null)
    setNoteDropTarget(null)
  }

  function openNoteFolderForm(folder: NoteFolder | null = null, parentId?: string) {
    setEditingNoteFolder(folder)
    setPendingParentNoteFolderId(parentId)
    setNoteFolderFormOpen(true)
  }

  function closeNoteFolderForm() {
    setNoteFolderFormOpen(false)
    setEditingNoteFolder(null)
    setPendingParentNoteFolderId(undefined)
  }

  async function handleSaveNoteFolder(f: NoteFolder) {
    await saveNoteFolder(f)
    closeNoteFolderForm()
  }

  return {
    allNotes,
    noteFolders,
    noteCount,
    standaloneNotes,
    dateNotes,
    noteFolderChildrenMap,
    rootNoteFolders,
    expandedNoteFolders,
    draggingNoteId,
    setDraggingNoteId,
    noteDropTarget,
    setNoteDropTarget,
    draggingNoteFolderId,
    setDraggingNoteFolderId,
    handleNoteFolderDrop,
    noteFolderFormOpen,
    editingNoteFolder,
    pendingParentNoteFolderId,
    activeNoteId,
    toggleNoteFolder,
    handleNewNote,
    handleNewNoteForDate,
    handleDeleteNote,
    handleDeleteNoteFolder,
    handleNoteDrop,
    openNoteFolderForm,
    closeNoteFolderForm,
    handleSaveNoteFolder,
    navigate,
    noteDelete,
    folderDelete,
  }
}
