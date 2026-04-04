import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { parseDateStr, today } from '../utils/dates'
import { getOccurrencesInRange } from '../utils/recurrence'
import { useRemindersStore } from '../store/reminders.store'
import { useTodosStore } from '../store/todos.store'
import { useUIStore } from '../store/ui.store'
import type { Reminder, Todo } from '../types/models'
import NoteEditor from './notes/NoteEditor'
import ReminderList from './reminders/ReminderList'
import ReminderForm from './reminders/ReminderForm'
import SortableTodoList from './todos/TodoList'
import TodoForm from './todos/TodoForm'

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return { label: 'Today', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' }
  if (cmp < 0)
    return { label: 'Past', cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/30 border border-slate-200 dark:border-white/10' }
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

  const todos = useTodosStore((s) => s.todos)
  const saveTodo = useTodosStore((s) => s.save)
  const removeTodo = useTodosStore((s) => s.remove)
  const reorderTodos = useTodosStore((s) => s.reorder)

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
  const [todoFormOpen, setTodoFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  useEffect(() => {
    if (!triggerNewReminder) return
    setTriggerNewReminder(false)
    setEditing(null)
    setFormOpen(true)
  }, [triggerNewReminder, setTriggerNewReminder])

  const dayReminders = useMemo(
    () => reminders.filter((r) => getOccurrencesInRange(r, plainDate, plainDate).length > 0),
    [reminders, plainDate],
  )

  const { overdueReminders, upcomingReminders } = useMemo(() => {
    const cmp = Temporal.PlainDate.compare(plainDate, Temporal.Now.plainDateISO())
    if (cmp < 0) return { overdueReminders: dayReminders, upcomingReminders: [] }
    if (cmp > 0) return { overdueReminders: [], upcomingReminders: dayReminders }
    // today — split by time
    const now = Temporal.Now.plainTimeISO()
    const overdue = dayReminders.filter((r) => r.time && Temporal.PlainTime.compare(Temporal.PlainTime.from(r.time), now) < 0)
    const upcoming = dayReminders.filter((r) => !r.time || Temporal.PlainTime.compare(Temporal.PlainTime.from(r.time), now) >= 0)
    return { overdueReminders: overdue, upcomingReminders: upcoming }
  }, [dayReminders, plainDate])

  const incompleteTodos = useMemo(
    () => todos.filter((t) => !t.completed && t.dueDate === dateStr),
    [todos, dateStr],
  )
  const completedTodayTodos = useMemo(
    () => todos.filter((t) => t.completed && t.completedAt?.startsWith(dateStr)),
    [todos, dateStr],
  )
  const dayTodos = useMemo(
    () => [...incompleteTodos, ...completedTodayTodos].sort((a, b) => a.order - b.order),
    [incompleteTodos, completedTodayTodos],
  )

  function handleToggleTodo(t: Todo) {
    const now = new Date().toISOString()
    saveTodo({ ...t, completed: !t.completed, completedAt: !t.completed ? now : undefined, updatedAt: now })
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
          <h1 className="text-3xl text-slate-900 dark:text-white/80 tracking-tight leading-none" style={{ fontFamily: "'Bree Serif', serif" }}>
            {weekday}
          </h1>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 dark:text-white/35 font-medium" style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 400 }}>{rest}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200/60 dark:border-white/[0.07] mb-6">
        {([
          { id: 'notes',     label: 'Notes',     count: null },
          { id: 'reminders', label: 'Reminders', count: dayReminders.length, overdue: overdueReminders.length, upcoming: upcomingReminders.length },
          { id: 'todos',     label: 'Todos',     count: incompleteTodos.length },
        ] as const).map(({ id, label, count, ...rest }) => (
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
              count !== null && count > 0 && (
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
      {tab === 'notes' && <NoteEditor date={dateStr} />}

      {tab === 'reminders' && (
        <ReminderList
          date={dateStr}
          reminders={dayReminders}
          onAdd={() => { setEditing(null); setFormOpen(true) }}
          onEdit={(r) => { setEditing(r); setFormOpen(true) }}
          onDelete={remove}
          onToggle={toggleComplete}
        />
      )}

      {tab === 'todos' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setEditingTodo(null); setTodoFormOpen(true) }}
              className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
            >
              + Add
            </button>
          </div>
          {dayTodos.length > 0 ? (
            <SortableTodoList
              todos={dayTodos}
              onToggle={handleToggleTodo}
              onEdit={(t) => { setEditingTodo(t); setTodoFormOpen(true) }}
              onDelete={removeTodo}
              onReorder={reorderTodos}
            />
          ) : (
            <p className="text-[13px] text-slate-400 dark:text-white/25">No todos yet.</p>
          )}
        </div>
      )}

      {formOpen && (
        <ReminderForm
          date={dateStr}
          reminder={editing}
          onSave={async (r) => { await save(r); setFormOpen(false) }}
          onClose={() => setFormOpen(false)}
        />
      )}

      {todoFormOpen && (
        <TodoForm
          todo={editingTodo}
          defaultDueDate={editingTodo ? undefined : dateStr}
          onSave={async (t) => { await saveTodo(t); setTodoFormOpen(false) }}
          onClose={() => setTodoFormOpen(false)}
        />
      )}
    </div>
  )
}
