import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../../store/todo_folders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { buildFolderTree, getDescendantIds } from '../../../lib/folderTree'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { TodoFolder } from '../../../types/models'

export function useListsNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)
  const removeFolder = useTodoFoldersStore((s) => s.remove)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const removeList = useTodoListsStore((s) => s.remove)

  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<TodoFolder | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [draggingListId, setDraggingListId] = useState<string | null>(null)
  const [listDropTarget, setListDropTarget] = useState<string | 'standalone' | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

  const listDelete = useConfirmDelete(useCallback((id: string) => {
    removeList(id)
    if (activeListId === id) navigate('/lists')
  }, [removeList, activeListId, navigate]))

  const folderDelete = useConfirmDelete(useCallback((id: string) => {
    const affectedLists = lists.filter((l) => l.folderId === id)
    affectedLists.forEach((l) => removeList(l.id))
    removeFolder(id)
  }, [lists, removeList, removeFolder]))

  useEffect(() => {
    loadLists()
    loadFolders()
  }, [loadLists, loadFolders])

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
    navigate('/lists/new', { state: opts })
  }

  function handleDeleteList(id: string, rect: DOMRect) {
    listDelete.requestDelete(id, rect, 'Delete this list? This cannot be undone.')
  }

  function handleDeleteFolder(id: string, rect: DOMRect) {
    const affectedLists = lists.filter((l) => l.folderId === id)
    let msg = 'Delete this folder? This cannot be undone.'
    if (affectedLists.length > 0) {
      msg = `This folder contains ${affectedLists.length} list(s). Delete everything?`
    }
    folderDelete.requestDelete(id, rect, msg)
  }

  const saveList = useTodoListsStore((s) => s.save)

  function handleListDrop(targetFolderId: string | undefined) {
    if (!draggingListId) return
    const list = lists.find((l) => l.id === draggingListId)
    if (!list || list.folderId === targetFolderId) return
    saveList({ ...list, folderId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingListId(null)
    setListDropTarget(null)
  }

  function handleFolderDrop(targetFolderId: string | undefined) {
    if (!draggingFolderId) return
    if (draggingFolderId === targetFolderId) return
    const folder = folders.find((f) => f.id === draggingFolderId)
    if (!folder || folder.parentId === targetFolderId) return
    if (targetFolderId) {
      const descendantIds = getDescendantIds(draggingFolderId, folderChildrenMap)
      if (descendantIds.has(targetFolderId)) return
    }
    saveFolder({ ...folder, parentId: targetFolderId, updatedAt: new Date().toISOString() })
    setDraggingFolderId(null)
    setListDropTarget(null)
  }

  function openFolderForm(folder: TodoFolder | null = null) {
    setEditingFolder(folder)
    setFolderFormOpen(true)
  }

  function closeFolderForm() {
    setFolderFormOpen(false)
    setEditingFolder(null)
  }

  async function handleSaveFolder(f: TodoFolder) {
    await saveFolder(f)
    closeFolderForm()
  }

  return {
    folders,
    lists,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    expandedFolders,
    folderFormOpen,
    editingFolder,
    activeListId,
    toggleFolder,
    openNewList,
    handleDeleteList,
    handleDeleteFolder,
    openFolderForm,
    closeFolderForm,
    handleSaveFolder,
    draggingListId,
    setDraggingListId,
    listDropTarget,
    setListDropTarget,
    draggingFolderId,
    setDraggingFolderId,
    handleListDrop,
    handleFolderDrop,
    listDelete,
    folderDelete,
  }
}
