import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../../store/todo_folders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { buildFolderTree } from '../../../lib/folderTree'
import type { TodoFolder, TodoList } from '../../../types/models'

export function useMobileTodosPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)

  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)
  const [newListDefaultDate, setNewListDefaultDate] = useState<string | undefined>()
  const [newListFolderId, setNewListFolderId] = useState<string | undefined>()
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
    setEditingList(null)
    setNewListDefaultDate(opts.dueDate)
    setNewListFolderId(opts.folderId)
    setListFormOpen(true)
  }

  async function handleSaveList(l: TodoList) {
    await saveList(l)
    setListFormOpen(false)
    setEditingList(null)
    navigate(`/lists/${l.id}`)
  }

  function closeListForm() {
    setListFormOpen(false)
    setEditingList(null)
  }

  async function handleSaveFolder(f: TodoFolder) {
    await saveFolder(f)
    setFolderFormOpen(false)
    setEditingFolder(null)
  }

  function openFolderForm() {
    setEditingFolder(null)
    setFolderFormOpen(true)
  }

  function closeFolderForm() {
    setFolderFormOpen(false)
    setEditingFolder(null)
  }

  return {
    navigate,
    folders,
    lists,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    activeListId,
    expandedFolders,
    toggleFolder,
    openNewList,
    listFormOpen,
    editingList,
    newListDefaultDate,
    newListFolderId,
    handleSaveList,
    closeListForm,
    folderFormOpen,
    editingFolder,
    openFolderForm,
    handleSaveFolder,
    closeFolderForm
  }
}
