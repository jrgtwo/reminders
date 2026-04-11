import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../../store/todo_folders.store'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { useUIStore } from '../../../store/ui.store'
import { buildFolderTree, getDescendantIds } from '../../../lib/folderTree'
import { useRemindersStore } from '../../../store/reminders.store'
import { getOccurrencesInRange } from '../../../utils/recurrence'
import { today, parseDateStr } from '../../../utils/dates'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { TodoFolder, TodoList } from '../../../types/models'

export function formatOverdueDate(dateStr: string): string {
  const t = today()
  const d = parseDateStr(dateStr)
  const diff = d.until(t, { largestUnit: 'days' }).days
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

export function formatUpcomingDate(dateStr: string): string {
  const t = today()
  const d = parseDateStr(dateStr)
  const diff = t.until(d, { largestUnit: 'days' }).days
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function useRightSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const rightOpen = useUIStore((s) => s.rightOpen)
  const setRightOpen = useUIStore((s) => s.setRightOpen)

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)
  const removeFolder = useTodoFoldersStore((s) => s.remove)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)
  const removeList = useTodoListsStore((s) => s.remove)

  const [width, setWidth] = useState(256)
  const dragging = useRef(false)
  const asideRef = useRef<HTMLElement>(null)

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startWidth = width
    const el = asideRef.current!
    el.style.transition = 'none'
    let lastWidth = startWidth

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return
      lastWidth = Math.max(180, Math.min(520, startWidth - (ev.clientX - startX)))
      el.style.width = lastWidth + 'px'
    }
    function onMouseUp() {
      dragging.current = false
      el.style.transition = ''
      setWidth(lastWidth)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<TodoFolder | null>(null)
  const [pendingParentFolderId, setPendingParentFolderId] = useState<string | undefined>()
  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)
  const [newListFolderId, setNewListFolderId] = useState<string | undefined>()
  const [newListDueDate, setNewListDueDate] = useState<string | undefined>()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [draggingListId, setDraggingListId] = useState<string | null>(null)
  const [listDropTarget, setListDropTarget] = useState<string | 'standalone' | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)

  const reminders = useRemindersStore((s) => s.reminders)
  const t = useMemo(() => today(), [])
  const yesterday = useMemo(() => t.subtract({ days: 1 }), [t])
  const weekStart = useMemo(() => t.subtract({ days: t.dayOfWeek - 1 }), [t])
  const weekEnd = useMemo(() => weekStart.add({ days: 6 }), [weekStart])

  const overdueReminders = useMemo(() => {
    const start = t.subtract({ days: 365 })
    const end = yesterday
    const items: { id: string; title: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, dateStr })
      }
    }
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    return items
  }, [reminders, t, yesterday])

  const upcomingReminders = useMemo(() => {
    const start = today()
    const end = start.add({ days: 30 })
    const items: { id: string; title: string; startTime?: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, startTime: r.startTime, dateStr })
      }
    }
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return items
  }, [reminders])

  const overdueYesterday = overdueReminders.filter((i) => i.dateStr === yesterday.toString())
  const overdueThisWeek = overdueReminders.filter(
    (i) => i.dateStr >= weekStart.toString() && i.dateStr < yesterday.toString()
  )
  const overdueOlder = overdueReminders.filter((i) => i.dateStr < weekStart.toString())
  const upcomingToday = upcomingReminders.filter((i) => i.dateStr === t.toString())
  const upcomingThisWeek = upcomingReminders.filter(
    (i) => i.dateStr > t.toString() && i.dateStr <= weekEnd.toString()
  )
  const upcomingLater = upcomingReminders.filter((i) => i.dateStr > weekEnd.toString())

  useEffect(() => {
    loadFolders()
    loadLists()
  }, [loadFolders, loadLists])

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

  const listDelete = useConfirmDelete(useCallback((id: string) => {
    removeList(id)
  }, [removeList]))

  const folderDelete = useConfirmDelete(useCallback((id: string) => {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const descendantIds = getDescendantIds(id, folderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedLists = adHocLists.filter((l) => l.folderId && allFolderIds.has(l.folderId))
    affectedLists.forEach((l) => removeList(l.id))
    allFolderIds.forEach((fid) => removeFolder(fid))
  }, [folders, folderChildrenMap, adHocLists, removeList, removeFolder]))

  function toggleFolder(id: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openNewList(opts: { folderId?: string; dueDate?: string } = {}) {
    setEditingList(null)
    setNewListFolderId(opts.folderId)
    setNewListDueDate(opts.dueDate)
    setListFormOpen(true)
  }

  const listCount = lists.length

  function handleDeleteFolder(id: string, rect: DOMRect) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const descendantIds = getDescendantIds(id, folderChildrenMap)
    const allFolderIds = new Set([id, ...descendantIds])
    const affectedLists = adHocLists.filter((l) => l.folderId && allFolderIds.has(l.folderId))
    let msg = 'Delete this folder? This cannot be undone.'
    if (affectedLists.length > 0 || descendantIds.size > 0) {
      const parts = [
        descendantIds.size > 0 ? `${descendantIds.size} subfolder(s)` : '',
        affectedLists.length > 0 ? `${affectedLists.length} list(s)` : '',
      ].filter(Boolean).join(' and ')
      msg = `This folder contains ${parts}. Delete everything?`
    }
    folderDelete.requestDelete(id, rect, msg)
  }

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

  function handleDeleteList(id: string, rect: DOMRect) {
    listDelete.requestDelete(id, rect, 'Delete this list? This cannot be undone.')
  }

  function openFolderForm(folder: TodoFolder | null, parentId?: string) {
    setEditingFolder(folder)
    setPendingParentFolderId(parentId)
    setFolderFormOpen(true)
  }

  function closeFolderForm() {
    setFolderFormOpen(false)
    setEditingFolder(null)
    setPendingParentFolderId(undefined)
  }

  async function handleSaveFolder(f: TodoFolder) {
    await saveFolder(f)
    closeFolderForm()
  }

  async function handleSaveListForm(l: TodoList) {
    await saveList(l)
    setListFormOpen(false)
    setEditingList(null)
    navigate(`/lists/${l.id}`)
  }

  function closeListForm() {
    setListFormOpen(false)
    setEditingList(null)
  }

  return {
    navigate,
    rightOpen,
    setRightOpen,
    folders,
    lists,
    asideRef,
    width,
    onResizeStart,
    folderFormOpen,
    editingFolder,
    pendingParentFolderId,
    listFormOpen,
    editingList,
    newListFolderId,
    newListDueDate,
    expandedFolders,
    draggingListId,
    setDraggingListId,
    listDropTarget,
    setListDropTarget,
    draggingFolderId,
    setDraggingFolderId,
    handleFolderDrop,
    overdueReminders,
    upcomingReminders,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingToday,
    upcomingThisWeek,
    upcomingLater,
    activeListId,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    listCount,
    toggleFolder,
    openNewList,
    handleDeleteFolder,
    handleListDrop,
    handleDeleteList,
    openFolderForm,
    closeFolderForm,
    handleSaveFolder,
    handleSaveListForm,
    closeListForm,
    listDelete,
    folderDelete,
  }
}
