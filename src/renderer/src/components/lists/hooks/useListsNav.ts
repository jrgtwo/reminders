import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../../store/todo_folders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { buildFolderTree } from '../../../lib/folderTree'
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

  useEffect(() => {
    loadLists()
    loadFolders()
  }, [loadLists, loadFolders])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

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

  function handleDeleteList(id: string) {
    removeList(id)
    if (activeListId === id) navigate('/lists')
  }

  function handleDeleteFolder(id: string) {
    const affectedLists = lists.filter((l) => l.folderId === id)
    if (affectedLists.length > 0) {
      if (!window.confirm(`This folder contains ${affectedLists.length} list(s). Delete everything?`)) return
      affectedLists.forEach((l) => removeList(l.id))
    }
    removeFolder(id)
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
  }
}
