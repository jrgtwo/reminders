import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { useRemindersStore } from '../../store/reminders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { useUIStore } from '../../store/ui.store'
import { useNotesStore } from '../../store/notes.store'
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
    initialTab === 'reminders' || initialTab === 'todos' ? initialTab : 'notes'
  )

  useEffect(() => {
    const stateTab = (location.state as { tab?: string } | null)?.tab
    if (stateTab === 'reminders' || stateTab === 'todos') {
      setTab(stateTab)
    }
  }, [location.state])

  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingListTitleId, setEditingListTitleId] = useState<string | null>(null)
  const [expandedListIds, setExpandedListIds] = useState<Set<string>>(new Set())

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
    save(newReminder).then(() => {
      setTab('reminders')
      setExpandedReminderId(newReminder.id)
    })
  }, [triggerNewReminder, setTriggerNewReminder, dateStr, save])

  const dayReminders = useMemo(
    () => reminders.filter((r) => getOccurrencesInRange(r, plainDate, plainDate).length > 0),
    [reminders, plainDate]
  )

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

  const dayLists = useMemo(
    () => lists.filter((l) => l.dueDate === dateStr).sort((a, b) => a.order - b.order),
    [lists, dateStr]
  )

  useEffect(() => {
    dayLists.forEach((l) => loadItems(l.id))
  }, [dayLists, loadItems])

  function handleToggleItem(item: TodoListItem) {
    const now = new Date().toISOString()
    saveItem({ ...item, completed: !item.completed, completedAt: !item.completed ? now : undefined, updatedAt: now })
  }

  async function handleAddItem(listId: string) {
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
    await saveItem(newItem)
    setEditingItemId(newItem.id)
  }

  async function handleSaveEdit(item: TodoListItem, title: string) {
    const trimmed = title.trim()
    if (!trimmed) {
      await deleteItem(item.id)
    } else {
      await saveItem({ ...item, title: trimmed, updatedAt: new Date().toISOString() })
    }
    setEditingItemId(null)
  }

  async function handleSaveDesc(item: TodoListItem, description: string) {
    await saveItem({ ...item, description: description || undefined, updatedAt: new Date().toISOString() })
  }

  async function handleCancelEdit(item: TodoListItem) {
    if (!item.title.trim()) {
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

  async function handleCreateInlineList() {
    const now = new Date().toISOString()
    const newList: TodoList = {
      id: crypto.randomUUID(),
      name: '',
      dueDate: dateStr,
      order: Date.now(),
      createdAt: now,
      updatedAt: now,
    }
    await saveList(newList)
    setExpandedListIds((prev) => new Set([...prev, newList.id]))
    setEditingListTitleId(newList.id)
  }

  async function handleSaveListTitle(listId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) {
      await removeList(listId)
    } else {
      const list = dayLists.find((l) => l.id === listId)
      if (list) await saveList({ ...list, name: trimmed, updatedAt: new Date().toISOString() })
    }
    setEditingListTitleId(null)
  }

  async function handleAddReminder() {
    const now = new Date().toISOString()
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: '',
      date: dateStr,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
    }
    await save(newReminder)
    setExpandedReminderId(newReminder.id)
  }

  function handleCancelReminder(reminder: Reminder) {
    if (!reminder.title.trim()) remove(reminder.id)
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
    saveNote(newNote)
    setEditingNoteId(newNote.id)
  }

  function handleDeleteNote(noteId: string) {
    const note = notes.get(noteId)
    if (!note) return
    if (window.confirm('Delete this note?')) {
      deleteNote(noteId)
      if (editingNoteId === noteId) {
        setEditingNoteId(null)
      }
    }
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
    notes,
    saveNote,
    items,
    reorderItems,
    deleteItem,
    dayReminders,
    overdueReminders,
    upcomingReminders,
    dayLists,
    timeFormat,
    toggleComplete,
    remove,
    save,
    removeList,
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
    navigate,
  }
}
