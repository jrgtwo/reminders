import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Trash2, Edit3, Pencil, ChevronRight } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../utils/dates'
import { getOccurrencesInRange } from '../utils/recurrence'
import { useRemindersStore } from '../store/reminders.store'
import { useTodoListsStore } from '../store/todo_lists.store'
import { useUIStore } from '../store/ui.store'
import type { Reminder, TodoList, TodoListItem, Note } from '../types/models'
import ReminderList from './reminders/ReminderList'
import ReminderForm from './reminders/ReminderForm'
import SortableTodoList from './todos/TodoList'
import { useNotesStore } from '../store/notes.store'
import NoteEditor from './notes/NoteEditor'

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return {
      label: 'Today',
      cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
    }
  if (cmp < 0)
    return {
      label: 'Past',
      cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/30 border border-slate-200 dark:border-white/10'
    }
  return null
}

export default function DayView() {
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

  useEffect(() => {
    loadLists()
  }, [loadLists])

  const triggerNewReminder = useUIStore((s) => s.triggerNewReminder)
  const setTriggerNewReminder = useUIStore((s) => s.setTriggerNewReminder)

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

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingListTitleId, setEditingListTitleId] = useState<string | null>(null)
  const [expandedListIds, setExpandedListIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!triggerNewReminder) return
    setTriggerNewReminder(false)
    setEditing(null)
    setFormOpen(true)
  }, [triggerNewReminder, setTriggerNewReminder])

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

  const { weekday, rest } = formatDayHeading(plainDate)
  const status = getDayStatus(plainDate)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-7">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-[13px] text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 mb-8 transition-colors -ml-0.5"
      >
        <ArrowLeft size={14} />
        Calendar
      </button>

      {/* Heading */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-1">
          <h1
            className="text-3xl text-slate-900 dark:text-white/80 tracking-tight leading-none"
            style={{ fontFamily: "'Bree Serif', serif" }}
          >
            {weekday}
          </h1>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>
        <p
          className="text-sm text-slate-400 dark:text-white/35 font-medium"
          style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 400 }}
        >
          {rest}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200/60 dark:border-white/[0.07] mb-6">
        {(
          [
            { id: 'notes', label: 'Notes', count: null },
            {
              id: 'reminders',
              label: 'Reminders',
              count: dayReminders.length,
              overdue: overdueReminders.length,
              upcoming: upcomingReminders.length
            },
            { id: 'todos', label: 'Todos', count: dayLists.length }
          ] as const
        ).map(({ id, label, count, ...rest }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === id
                ? 'text-slate-900 dark:text-[#f0f0f0]'
                : 'text-slate-400 dark:text-white/35 hover:text-slate-600 dark:hover:text-white/60'
            }`}
          >
            {label}
            {id === 'reminders' ? (
              <>
                {'overdue' in rest && rest.overdue > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8a045]/[0.15] text-[#e8a045]">
                    {rest.overdue}
                  </span>
                )}
                {'upcoming' in rest && rest.upcoming > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6498c8]/[0.15] text-[#6498c8]">
                    {rest.upcoming}
                  </span>
                )}
              </>
            ) : (
              count !== null &&
              count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6498c8]/[0.15] text-[#6498c8]">
                  {count}
                </span>
              )
            )}
            {tab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'notes' && (
        <div>
          {(() => {
            const existingNotes = Array.from(notes.values()).filter((n) => n.date === dateStr)

            const handleNew = () => {
              const now = new Date()
              const newNote: Note = {
                id: crypto.randomUUID(),
                content: '',
                title: '',
                date: dateStr,
                displayOrder: 0,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
              }
              saveNote(newNote)
              setEditingNoteId(newNote.id)
            }

            const handleNoteChange = (updatedNote: Note) => {
              saveNote(updatedNote)
            }

            const handleDelete = (noteId: string) => {
              const note = notes.get(noteId)
              if (!note) return
              if (window.confirm('Delete this note?')) {
                deleteNote(noteId)
                if (editingNoteId === noteId) {
                  setEditingNoteId(null)
                }
              }
            }

            if (existingNotes.length === 0) {
              return (
                <div className="mb-8 min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-[13px] text-slate-400 dark:text-white/25 mb-4">
                        No notes for this day yet.
                      </p>
                      <button
                        onClick={handleNew}
                        className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                      >
                        + Create your first note
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div className="mb-8 flex flex-col gap-2">
                {existingNotes.map((note) => (
                  <div key={note.id}>
                    <button
                      onClick={() => setEditingNoteId(note.id === editingNoteId ? null : note.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.09] transition-colors shadow-sm group"
                    >
                      <Edit3
                        size={15}
                        className={`shrink-0 transition-colors ${note.id === editingNoteId ? 'text-[#6498c8]' : 'text-slate-400 dark:text-white/35'}`}
                      />
                      <div className="flex-1 min-w-0">
                        {note.title ? (
                          <div className="text-[14px] font-medium text-slate-800 dark:text-white/80 truncate">
                            {note.title}
                          </div>
                        ) : (
                          <div className="text-[13px] text-slate-400 dark:text-white/35 italic">
                            Untitled
                          </div>
                        )}
                        {note.content && (
                          <div className="text-[12px] text-slate-400 dark:text-white/25 mt-0.5 truncate">
                            {note.content.replace(/[#*`>\[\]]/g, '').slice(0, 100)}
                            {note.content.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <ArrowRight
                        size={13}
                        className={`shrink-0 text-slate-300 dark:text-white/20 transition-transform ${note.id === editingNoteId ? 'rotate-90' : ''}`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </button>
                    {note.id === editingNoteId && (
                      <NoteEditor
                        note={note}
                        onChange={handleNoteChange}
                        onDelete={() => handleDelete(note.id)}
                        onBack={() => setEditingNoteId(null)}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={handleNew}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Add note
                </button>
              </div>
            )
          })()}
        </div>
      )}

      {tab === 'reminders' && (
        <ReminderList
          date={dateStr}
          reminders={dayReminders}
          onAdd={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          onEdit={(r) => {
            setEditing(r)
            setFormOpen(true)
          }}
          onDelete={remove}
          onToggle={toggleComplete}
        />
      )}

      {tab === 'todos' && (
        <div className="flex flex-col gap-3">
          {dayLists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-[13px] text-slate-400 dark:text-white/25">No lists for this day yet.</p>
              <button
                onClick={handleCreateInlineList}
                className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
              >
                + New list
              </button>
            </div>
          )}
          {dayLists.map((l) => {
            const isExpanded = expandedListIds.has(l.id)
            const listItems = (items.get(l.id) ?? []).filter((i) => !i.completed).sort((a, b) => a.order - b.order)
            const completedItems = (items.get(l.id) ?? []).filter((i) => i.completed).sort((a, b) => a.order - b.order)
            const totalCount = listItems.length + completedItems.length
            return (
              <div key={l.id}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleListExpanded(l.id)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 group"
                  >
                    <ChevronRight
                      size={15}
                      className={`shrink-0 text-slate-400 dark:text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    {editingListTitleId === l.id ? (
                      <input
                        autoFocus
                        defaultValue={l.name}
                        placeholder="List name"
                        className="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-white/80 tracking-tight placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none"
                        style={{ fontFamily: "'Bree Serif', serif" }}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleSaveListTitle(l.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveListTitle(l.id, e.currentTarget.value) }
                          if (e.key === 'Escape') { e.preventDefault(); handleSaveListTitle(l.id, e.currentTarget.value) }
                        }}
                      />
                    ) : (
                      <span className="text-[15px] font-semibold text-slate-900 dark:text-white/80 tracking-tight truncate" style={{ fontFamily: "'Bree Serif', serif" }}>
                        {l.name || <span className="italic text-slate-400 dark:text-white/25">Untitled</span>}
                      </span>
                    )}
                    {!isExpanded && totalCount > 0 && (
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-white/30 ml-1">{totalCount}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => setEditingListTitleId(l.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {isExpanded && (
                      <button
                        onClick={() => handleAddItem(l.id)}
                        className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 pl-5">
                    {listItems.length === 0 && completedItems.length === 0 ? (
                      <p className="text-[13px] text-slate-400 dark:text-white/25">No items yet. Add one above.</p>
                    ) : (
                      <>
                        <SortableTodoList
                          todos={listItems}
                          onToggle={handleToggleItem}
                          onEdit={(i) => setEditingItemId(i.id)}
                          onDelete={deleteItem}
                          onReorder={(ids) => reorderItems(l.id, ids)}
                          editingItemId={editingItemId}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onSaveDesc={handleSaveDesc}
                        />
                        {completedItems.length > 0 && (
                          <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">Done</p>
                            <SortableTodoList
                              todos={completedItems}
                              onToggle={handleToggleItem}
                              onEdit={(i) => setEditingItemId(i.id)}
                              onDelete={deleteItem}
                              onReorder={(ids) => reorderItems(l.id, ids)}
                              editingItemId={editingItemId}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={handleCancelEdit}
                              onSaveDesc={handleSaveDesc}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {dayLists.length > 0 && (
            <button
              onClick={handleCreateInlineList}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              New list
            </button>
          )}
        </div>
      )}

      {formOpen && (
        <ReminderForm
          date={dateStr}
          reminder={editing}
          onSave={async (r) => {
            await save(r)
            setFormOpen(false)
          }}
          onClose={() => setFormOpen(false)}
        />
      )}

    </div>
  )
}
