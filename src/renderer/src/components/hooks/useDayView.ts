import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { useRemindersStore } from '../../store/reminders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import { useNotesStore } from '../../store/notes.store'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import type { Reminder, TodoList, TodoListItem, Note } from '../../types/models'

export function useDayView() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const dateStr = date ?? today().toString()
  const plainDate = useMemo(() => parseDateStr(dateStr), [dateStr])

  const reminders = useRemindersStore((s) => s.reminders)
  const save = useRemindersStore((s) => s.save)
  const remove = useRemindersStore((s) => s.remove)
  const toggleComplete = useRemindersStore((s) => s.toggleComplete)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)
  const removeList = useTodoListsStore((s) => s.remove)
  const items = useTodoListsStore((s) => s.items)
  const loadItems = useTodoListsStore((s) => s.loadItems)
  const saveItem = useTodoListsStore((s) => s.saveItem)
  const deleteItem = useTodoListsStore((s) => s.deleteItem)
  const reorderItems = useTodoListsStore((s) => s.reorderItems)

  const notes = useNotesStore((s) => s.notes)
  const saveNote = useNotesStore((s) => s.saveNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)

  const triggerNewReminder = useUIStore((s) => s.triggerNewReminder)
  const setTriggerNewReminder = useUIStore((s) => s.setTriggerNewReminder)
  const timeFormat = useUIStore((s) => s.timeFormat)

  const initialTab = (location.state as { tab?: string } | null)?.tab
  const [tab, setTab] = useState<'notes' | 'reminders' | 'todos'>(
    initialTab === 'reminders' || initialTab === 'todos' || initialTab === 'notes' ? initialTab : 'notes'
  )

  useEffect(() => {
    const stateTab = (location.state as { tab?: string } | null)?.tab
    if (stateTab === 'reminders' || stateTab === 'todos' || stateTab === 'notes') {
      setTab(stateTab)
    }
  }, [location.state])

  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingListTitleId, setEditingListTitleId] = useState<string | null>(null)
  const [expandedListIds, setExpandedListIds] = useState<Set<string>>(new Set())
  const [draftReminder, setDraftReminder] = useState<Reminder | null>(null)
  const [draftList, setDraftList] = useState<TodoList | null>(null)
  const [draftItemsByList, setDraftItemsByList] = useState<Map<string, TodoListItem>>(new Map())
  const [draftNote, setDraftNote] = useState<Note | null>(null)

  const reminderDelete = useConfirmDelete(useCallback((id: string) => {
    if (draftReminder && draftReminder.id === id) setDraftReminder(null)
    else remove(id)
    if (expandedReminderId === id) setExpandedReminderId(null)
  }, [remove, expandedReminderId, draftReminder]))

  const noteDelete = useConfirmDelete(useCallback((id: string) => {
    if (draftNote && draftNote.id === id) setDraftNote(null)
    else deleteNote(id)
    if (editingNoteId === id) setEditingNoteId(null)
  }, [deleteNote, editingNoteId, draftNote]))

  const listDelete = useConfirmDelete(useCallback((id: string) => {
    if (draftList && draftList.id === id) setDraftList(null)
    else removeList(id)
  }, [removeList, draftList]))

  const itemDelete = useConfirmDelete(useCallback((id: string) => {
    const draftListId = Array.from(draftItemsByList.entries()).find(([, i]) => i.id === id)?.[0]
    if (draftListId) {
      setDraftItemsByList((prev) => {
        const next = new Map(prev)
        next.delete(draftListId)
        return next
      })
    } else {
      deleteItem(id)
    }
  }, [deleteItem, draftItemsByList]))

  useEffect(() => {
    loadLists()
  }, [loadLists])

  useEffect(() => {
    if (!triggerNewReminder) return
    setTriggerNewReminder(false)
    const now = new Date().toISOString()
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: '',
      date: dateStr,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
    }
    setDraftReminder(newReminder)
    setTab('reminders')
    setExpandedReminderId(newReminder.id)
  }, [triggerNewReminder, setTriggerNewReminder, dateStr])

  const dayReminders = useMemo(() => {
    const base = reminders.filter((r) => getOccurrencesInRange(r, plainDate, plainDate).length > 0)
    return draftReminder && draftReminder.date === dateStr ? [...base, draftReminder] : base
  }, [reminders, plainDate, draftReminder, dateStr])

  const { overdueReminders, upcomingReminders } = useMemo(() => {
    const cmp = Temporal.PlainDate.compare(plainDate, Temporal.Now.plainDateISO())
    if (cmp < 0) return { overdueReminders: dayReminders, upcomingReminders: [] }
    if (cmp > 0) return { overdueReminders: [], upcomingReminders: dayReminders }
    const now = Temporal.Now.plainTimeISO()
    const overdue = dayReminders.filter(
      (r) => r.startTime && Temporal.PlainTime.compare(Temporal.PlainTime.from(r.startTime), now) < 0
    )
    const upcoming = dayReminders.filter(
      (r) => !r.startTime || Temporal.PlainTime.compare(Temporal.PlainTime.from(r.startTime), now) >= 0
    )
    return { overdueReminders: overdue, upcomingReminders: upcoming }
  }, [dayReminders, plainDate])

  const dayLists = useMemo(() => {
    const base = lists.filter((l) => l.dueDate === dateStr).sort((a, b) => a.order - b.order)
    return draftList && draftList.dueDate === dateStr ? [...base, draftList] : base
  }, [lists, dateStr, draftList])

  const itemsWithDrafts = useMemo(() => {
    if (draftItemsByList.size === 0) return items
    const merged = new Map(items)
    draftItemsByList.forEach((draft, listId) => {
      const existing = merged.get(listId) ?? []
      merged.set(listId, [...existing, draft])
    })
    return merged
  }, [items, draftItemsByList])

  const notesWithDrafts = useMemo(() => {
    if (!draftNote) return notes
    const merged = new Map(notes)
    merged.set(draftNote.id, draftNote)
    return merged
  }, [notes, draftNote])

  useEffect(() => {
    dayLists.forEach((l) => loadItems(l.id))
  }, [dayLists, loadItems])

  function handleToggleItem(item: TodoListItem) {
    const now = new Date().toISOString()
    saveItem({ ...item, completed: !item.completed, completedAt: !item.completed ? now : undefined, updatedAt: now })
  }

  function handleAddItem(listId: string) {
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
    setDraftItemsByList((prev) => {
      const next = new Map(prev)
      next.set(listId, newItem)
      return next
    })
    setEditingItemId(newItem.id)
  }

  function clearDraftItem(listId: string) {
    setDraftItemsByList((prev) => {
      if (!prev.has(listId)) return prev
      const next = new Map(prev)
      next.delete(listId)
      return next
    })
  }

  async function handleSaveEdit(item: TodoListItem, title: string) {
    const trimmed = title.trim()
    const draft = draftItemsByList.get(item.listId)
    const isDraft = draft?.id === item.id
    if (!trimmed) {
      if (isDraft) clearDraftItem(item.listId)
      else await deleteItem(item.id)
    } else {
      await saveItem({ ...item, title: trimmed, updatedAt: new Date().toISOString() })
      if (isDraft) clearDraftItem(item.listId)
    }
    setEditingItemId(null)
  }

  async function handleSaveDesc(item: TodoListItem, description: string) {
    await saveItem({ ...item, description: description || undefined, updatedAt: new Date().toISOString() })
  }

  async function handleCancelEdit(item: TodoListItem) {
    const draft = draftItemsByList.get(item.listId)
    const isDraft = draft?.id === item.id
    if (isDraft) {
      clearDraftItem(item.listId)
    } else if (!item.title.trim()) {
      await deleteItem(item.id)
    }
    setEditingItemId(null)
  }

  function toggleListExpanded(listId: string) {
    setExpandedListIds((prev) => {
      const next = new Set(prev)
      if (next.has(listId)) next.delete(listId)
      else next.add(listId)
      return next
    })
  }

  function handleCreateInlineList() {
    const now = new Date().toISOString()
    const newList: TodoList = {
      id: crypto.randomUUID(),
      name: '',
      dueDate: dateStr,
      order: Date.now(),
      createdAt: now,
      updatedAt: now,
    }
    setDraftList(newList)
    setExpandedListIds((prev) => new Set([...prev, newList.id]))
    setEditingListTitleId(newList.id)
  }

  async function handleSaveListTitle(listId: string, name: string) {
    const trimmed = name.trim()
    const isDraft = draftList?.id === listId
    if (!trimmed) {
      if (isDraft) setDraftList(null)
      else await removeList(listId)
    } else if (isDraft) {
      await saveList({ ...draftList!, name: trimmed, updatedAt: new Date().toISOString() })
      setDraftList(null)
    } else {
      const list = dayLists.find((l) => l.id === listId)
      if (list) await saveList({ ...list, name: trimmed, updatedAt: new Date().toISOString() })
    }
    setEditingListTitleId(null)
  }

  function handleAddReminder() {
    const now = new Date().toISOString()
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: '',
      date: dateStr,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
    }
    setDraftReminder(newReminder)
    setExpandedReminderId(newReminder.id)
  }

  async function handleSaveReminder(r: Reminder) {
    await save(r)
    if (draftReminder && draftReminder.id === r.id) setDraftReminder(null)
    setExpandedReminderId(null)
  }

  function handleCancelReminder(reminder: Reminder) {
    if (draftReminder && draftReminder.id === reminder.id) {
      setDraftReminder(null)
    } else if (!reminder.title.trim()) {
      remove(reminder.id)
    }
    setExpandedReminderId(null)
  }

  function handleNewNote() {
    const now = new Date()
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: '',
      title: '',
      date: dateStr,
      displayOrder: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    setDraftNote(newNote)
    setEditingNoteId(newNote.id)
  }

  async function handleSaveDraftNote(note: Note) {
    await saveNote(note)
    if (draftNote && draftNote.id === note.id) setDraftNote(null)
  }

  function handleDeleteNote(noteId: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    noteDelete.requestDelete(noteId, rect, 'Delete this note? This cannot be undone.')
  }

  function handleDeleteReminder(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    reminderDelete.requestDelete(id, rect, 'Delete this reminder? This cannot be undone.')
  }

  function handleDeleteList(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    listDelete.requestDelete(id, rect, 'Delete this list? This cannot be undone.')
  }

  function handleDeleteItem(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    itemDelete.requestDelete(id, rect, 'Delete this item?')
  }

  return {
    dateStr,
    plainDate,
    tab,
    setTab,
    expandedReminderId,
    setExpandedReminderId,
    editingNoteId,
    setEditingNoteId,
    editingItemId,
    setEditingItemId,
    editingListTitleId,
    setEditingListTitleId,
    expandedListIds,
    notes: notesWithDrafts,
    saveNote: handleSaveDraftNote,
    items: itemsWithDrafts,
    reorderItems,
    dayReminders,
    overdueReminders,
    upcomingReminders,
    dayLists,
    timeFormat,
    toggleComplete,
    save: handleSaveReminder,
    handleToggleItem,
    handleAddItem,
    handleSaveEdit,
    handleSaveDesc,
    handleCancelEdit,
    toggleListExpanded,
    handleCreateInlineList,
    handleSaveListTitle,
    handleAddReminder,
    handleCancelReminder,
    handleNewNote,
    handleDeleteNote,
    handleDeleteReminder,
    handleDeleteList,
    handleDeleteItem,
    reminderDelete,
    noteDelete,
    listDelete,
    itemDelete,
    navigate,
  }
}
