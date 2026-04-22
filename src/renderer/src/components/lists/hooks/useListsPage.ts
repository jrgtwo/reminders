import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTodoListsStore } from '../../../store/todo_lists.store'
import { useTodoFoldersStore } from '../../../store/todo_folders.store'
import type { TodoListItem, TodoList } from '../../../types/models'

export function useListsPage() {
  const { listId } = useParams<{ listId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const folders = useTodoFoldersStore((s) => s.folders)
  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)
  const items = useTodoListsStore((s) => s.items)
  const loadItems = useTodoListsStore((s) => s.loadItems)
  const saveItem = useTodoListsStore((s) => s.saveItem)
  const deleteItem = useTodoListsStore((s) => s.deleteItem)
  const reorderItems = useTodoListsStore((s) => s.reorderItems)

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [draftItem, setDraftItem] = useState<TodoListItem | null>(null)

  const isNew = listId === 'new'
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newFolderId, setNewFolderId] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadLists()
  }, [loadLists])

  useEffect(() => {
    if (listId && listId !== 'new') loadItems(listId)
  }, [listId, loadItems])

  useEffect(() => {
    if (isNew) {
      const state = (location.state ?? {}) as { folderId?: string; dueDate?: string }
      setNewName('')
      setNewDate(state.dueDate ?? '')
      setNewFolderId(state.folderId ?? '')
      setCreateError('')
      setCreating(false)
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [isNew, listId, location.state])

  const selectedList = useMemo<TodoList | null>(
    () => lists.find((l) => l.id === listId) ?? null,
    [lists, listId]
  )

  const listItems = useMemo(() => {
    if (!listId) return []
    const base = (items.get(listId) ?? []).filter((i) => !i.completed).sort((a, b) => a.order - b.order)
    return draftItem && draftItem.listId === listId ? [...base, draftItem] : base
  }, [items, listId, draftItem])
  const completedItems = useMemo(
    () =>
      listId
        ? (items.get(listId) ?? []).filter((i) => i.completed).sort((a, b) => a.order - b.order)
        : [],
    [items, listId]
  )

  function handleToggle(item: TodoListItem) {
    const now = new Date().toISOString()
    saveItem({
      ...item,
      completed: !item.completed,
      completedAt: !item.completed ? now : undefined,
      updatedAt: now,
    })
  }

  function handleAddItem() {
    if (!listId) return
    const now = new Date().toISOString()
    const newItem: TodoListItem = {
      id: crypto.randomUUID(),
      listId,
      title: '',
      order: Date.now(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    }
    setDraftItem(newItem)
    setEditingItemId(newItem.id)
  }

  async function handleSaveEdit(item: TodoListItem, title: string) {
    const trimmed = title.trim()
    const isDraft = draftItem?.id === item.id
    if (!trimmed) {
      if (isDraft) setDraftItem(null)
      else await deleteItem(item.id)
    } else {
      await saveItem({ ...item, title: trimmed, updatedAt: new Date().toISOString() })
      if (isDraft) setDraftItem(null)
    }
    setEditingItemId(null)
  }

  async function handleSaveDesc(item: TodoListItem, description: string) {
    await saveItem({ ...item, description: description || undefined, updatedAt: new Date().toISOString() })
  }

  async function handleCancelEdit(item: TodoListItem) {
    const isDraft = draftItem?.id === item.id
    if (isDraft) {
      setDraftItem(null)
    } else if (!item.title.trim()) {
      await deleteItem(item.id)
    }
    setEditingItemId(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      setCreateError('Name is required')
      return
    }
    setCreating(true)
    const now = new Date().toISOString()
    const l: TodoList = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      folderId: newFolderId || undefined,
      dueDate: newDate || undefined,
      order: Date.now(),
      createdAt: now,
      updatedAt: now,
    }
    try {
      await saveList(l)
      navigate(`/lists/${l.id}`, { replace: true })
    } catch {
      setCreateError('Failed to create list')
      setCreating(false)
    }
  }

  function handleNewDateChange(val: string) {
    setNewDate(val)
    if (val) setNewFolderId('')
  }

  function handleNewFolderChange(val: string) {
    setNewFolderId(val)
    if (val) setNewDate('')
  }

  async function handleDateChange(val: string) {
    if (!selectedList) return
    const now = new Date().toISOString()
    await saveList({ ...selectedList, dueDate: val || undefined, updatedAt: now })
    setEditingDate(false)
  }

  async function handleRenameList(l: TodoList) {
    await saveList(l)
    setRenameOpen(false)
  }

  return {
    listId,
    folders,
    lists,
    selectedList,
    listItems,
    completedItems,
    isNew,
    newName,
    setNewName,
    newDate,
    newFolderId,
    createError,
    setCreateError,
    creating,
    nameInputRef,
    editingItemId,
    setEditingItemId,
    renameOpen,
    setRenameOpen,
    editingDate,
    setEditingDate,
    deleteItem,
    reorderItems,
    navigate,
    handleToggle,
    handleAddItem,
    handleSaveEdit,
    handleSaveDesc,
    handleCancelEdit,
    handleCreate,
    handleNewDateChange,
    handleNewFolderChange,
    handleDateChange,
    handleRenameList,
  }
}
