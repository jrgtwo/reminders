import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { initStorage } from '../platform'
import type { IStorageAdapter } from '../platform/types'
import type { Reminder, Note, Todo } from '../types/models'

const LAST_PULL_KEY = (userId: string) => `sync_last_pull_${userId}`
const FIRST_LOGIN_KEY = (userId: string) => `sync_first_login_done_${userId}`

// --- Row mappers ---

function reminderToRow(r: Reminder, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    description: r.description ?? null,
    date: r.date,
    time: r.time ?? null,
    recurrence: r.recurrence ? JSON.stringify(r.recurrence) : null,
    completed_dates: JSON.stringify(r.completedDates),
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

function rowToReminder(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    time: row.time ?? undefined,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
    completedDates: row.completed_dates ? JSON.parse(row.completed_dates) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function noteToRow(n: Note, userId: string) {
  return {
    date: n.date,
    user_id: userId,
    content: n.content,
    updated_at: n.updatedAt,
  }
}

function rowToNote(row: any): Note {
  return {
    date: row.date,
    content: row.content,
    updatedAt: row.updated_at,
  }
}

function todoToRow(t: Todo, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    description: t.description ?? null,
    sort_order: t.order,
    completed: t.completed ? 1 : 0,
    completed_at: t.completedAt ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

function rowToTodo(row: any, localOrder?: number): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    order: localOrder ?? row.sort_order,
    completed: !!row.completed,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// --- First login ---

export async function webCheckFirstLogin(userId: string): Promise<{
  isFirstLogin: boolean
  hasLocal: boolean
  hasRemote: boolean
}> {
  if (localStorage.getItem(FIRST_LOGIN_KEY(userId))) {
    return { isFirstLogin: false, hasLocal: false, hasRemote: false }
  }

  const adapter = await initStorage()
  const [reminders, notes, todos] = await Promise.all([
    adapter.getReminders(),
    adapter.getAllNotes(),
    adapter.getTodos(),
  ])
  const hasLocal = reminders.length + notes.length + todos.length > 0

  const [{ count: rc }, { count: nc }, { count: tc }] = await Promise.all([
    supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
    supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
  ])
  const hasRemote = ((rc ?? 0) + (nc ?? 0) + (tc ?? 0)) > 0

  return { isFirstLogin: true, hasLocal, hasRemote }
}

export function webMarkFirstLoginDone(userId: string): void {
  localStorage.setItem(FIRST_LOGIN_KEY(userId), '1')
}

// --- Sync ---

export async function webSync(session: Session): Promise<{ lastSyncedAt: string }> {
  const userId = session.user.id
  const adapter = await initStorage()
  const lastPullAt = localStorage.getItem(LAST_PULL_KEY(userId))

  await pull(userId, lastPullAt, adapter)
  await push(userId, adapter)

  const now = new Date().toISOString()
  localStorage.setItem(LAST_PULL_KEY(userId), now)
  return { lastSyncedAt: now }
}

async function pull(
  userId: string,
  lastPullAt: string | null,
  adapter: IStorageAdapter
): Promise<void> {
  // Reminders
  let remindersQuery = supabase.from('reminders').select('*').eq('user_id', userId)
  if (lastPullAt) remindersQuery = remindersQuery.gt('updated_at', lastPullAt)
  const { data: remoteReminders, error: rErr } = await remindersQuery
  if (rErr) throw rErr

  const localReminders = await adapter.getReminders()
  const localReminderMap = new Map(localReminders.map((r) => [r.id, r]))

  for (const row of remoteReminders ?? []) {
    if (row.deleted_at) {
      if (localReminderMap.has(row.id)) await adapter.deleteReminder(row.id)
      continue
    }
    const local = localReminderMap.get(row.id)
    if (!local) {
      await adapter.saveReminder(rowToReminder(row))
    } else {
      const remoteTs = new Date(row.updated_at).getTime()
      const localTs = new Date(local.updatedAt).getTime()
      const remoteDates: string[] = row.completed_dates ? JSON.parse(row.completed_dates) : []
      const mergedDates = [...new Set([...local.completedDates, ...remoteDates])]
      if (remoteTs >= localTs) {
        await adapter.saveReminder({ ...rowToReminder(row), completedDates: mergedDates })
      } else if (mergedDates.length !== local.completedDates.length) {
        await adapter.saveReminder({ ...local, completedDates: mergedDates })
      }
    }
  }

  // Notes
  let notesQuery = supabase.from('notes').select('*').eq('user_id', userId)
  if (lastPullAt) notesQuery = notesQuery.gt('updated_at', lastPullAt)
  const { data: remoteNotes, error: nErr } = await notesQuery
  if (nErr) throw nErr

  for (const row of remoteNotes ?? []) {
    if (row.deleted_at) continue
    const local = await adapter.getNoteByDate(row.date)
    if (!local || new Date(row.updated_at).getTime() >= new Date(local.updatedAt).getTime()) {
      await adapter.saveNote(rowToNote(row))
    }
  }

  // Todos
  let todosQuery = supabase.from('todos').select('*').eq('user_id', userId)
  if (lastPullAt) todosQuery = todosQuery.gt('updated_at', lastPullAt)
  const { data: remoteTodos, error: tErr } = await todosQuery
  if (tErr) throw tErr

  const localTodos = await adapter.getTodos()
  const localTodoMap = new Map(localTodos.map((t) => [t.id, t]))

  for (const row of remoteTodos ?? []) {
    if (row.deleted_at) {
      if (localTodoMap.has(row.id)) await adapter.deleteTodo(row.id)
      continue
    }
    const local = localTodoMap.get(row.id)
    if (!local) {
      await adapter.saveTodo(rowToTodo(row))
    } else if (new Date(row.updated_at).getTime() >= new Date(local.updatedAt).getTime()) {
      await adapter.saveTodo(rowToTodo(row, local.order))
    }
  }
}

async function push(
  userId: string,
  adapter: IStorageAdapter
): Promise<void> {
  const [reminders, notes, todos] = await Promise.all([
    adapter.getReminders(),
    adapter.getAllNotes(),
    adapter.getTodos(),
  ])

  if (reminders.length) {
    const { error } = await supabase.from('reminders').upsert(
      reminders.map((r) => reminderToRow(r, userId))
    )
    if (error) throw error
  }

  if (notes.length) {
    const { error } = await supabase.from('notes').upsert(
      notes.map((n) => noteToRow(n, userId))
    )
    if (error) throw error
  }

  if (todos.length) {
    const { error } = await supabase.from('todos').upsert(
      todos.map((t) => todoToRow(t, userId))
    )
    if (error) throw error
  }
}
