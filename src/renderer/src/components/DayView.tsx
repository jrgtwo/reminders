import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, List, ArrowRight, Trash2, Edit3 } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../utils/dates'
import { getOccurrencesInRange } from '../utils/recurrence'
import { useRemindersStore } from '../store/reminders.store'
import { useTodoListsStore } from '../store/todo_lists.store'
import { useUIStore } from '../store/ui.store'
import type { Reminder, TodoList, Note } from '../types/models'
import ReminderList from './reminders/ReminderList'
import ReminderForm from './reminders/ReminderForm'
import ListForm from './lists/ListForm'
import { useTodoFoldersStore } from '../store/todo_folders.store'
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
  const folders = useTodoFoldersStore((s) => s.folders)

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
  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)

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
      (r) => r.time && Temporal.PlainTime.compare(Temporal.PlainTime.from(r.time), now) < 0
    )
    const upcoming = dayReminders.filter(
      (r) => !r.time || Temporal.PlainTime.compare(Temporal.PlainTime.from(r.time), now) >= 0
    )
    return { overdueReminders: overdue, upcomingReminders: upcoming }
  }, [dayReminders, plainDate])

  const dayLists = useMemo(
    () => lists.filter((l) => l.dueDate === dateStr).sort((a, b) => a.order - b.order),
    [lists, dateStr]
  )

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
                ? 'text-slate-900 dark:text-white'
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
            const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

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

            const editingNote = editingNoteId ? notes.get(editingNoteId) : undefined

            if (editingNoteId && editingNote) {
              return (
                <NoteEditor
                  note={editingNote}
                  onChange={handleNoteChange}
                  onDelete={() => handleDelete(editingNoteId)}
                  onBack={() => setEditingNoteId(null)}
                />
              )
            }

            return (
              <div className="mb-8 flex flex-col gap-2">
                {existingNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setEditingNoteId(note.id)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.09] transition-colors shadow-sm group"
                  >
                    <Edit3 size={15} className="shrink-0 text-[#6498c8]" />
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
                    <ArrowRight size={13} className="shrink-0 text-slate-300 dark:text-white/20" />
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
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => {
                setEditingList(null)
                setListFormOpen(true)
              }}
              className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
            >
              + New list
            </button>
          </div>
          {dayLists.length > 0 ? (
            <div className="flex flex-col gap-2">
              {dayLists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/lists/${l.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.09] transition-colors shadow-sm"
                >
                  <List size={15} className="shrink-0 text-[#6498c8]" />
                  <span className="text-[14px] font-medium text-slate-800 dark:text-white/80 flex-1 truncate">
                    {l.name}
                  </span>
                  <ArrowRight size={13} className="shrink-0 text-slate-300 dark:text-white/20" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-slate-400 dark:text-white/25">
              No lists for this day yet.
            </p>
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

      {listFormOpen && (
        <ListForm
          list={editingList}
          folders={folders}
          defaultDueDate={dateStr}
          onSave={async (l) => {
            await saveList(l)
            setListFormOpen(false)
            navigate(`/lists/${l.id}`)
          }}
          onClose={() => setListFormOpen(false)}
        />
      )}
    </div>
  )
}
