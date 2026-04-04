import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { initStorage, getRawStorage } from '../platform'
import type { IStorageAdapter } from '../platform/types'
import type { Reminder, Note, Todo, TodoFolder, TodoList } from '../types/models'

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
    due_date: t.dueDate ?? null,
    list_id: t.listId ?? null,
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
    dueDate: row.due_date ?? undefined,
    listId: row.list_id ?? undefined,
    order: localOrder ?? row.sort_order,
    completed: !!row.completed,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function folderToRow(f: TodoFolder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    sort_order: f.order,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  }
}

function rowToFolder(row: any): TodoFolder {
  return {
    id: row.id,
    name: row.name,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function listToRow(l: TodoList, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    name: l.name,
    folder_id: l.folderId ?? null,
    sort_order: l.order,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  }
}

function rowToList(row: any): TodoList {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id ?? undefined,
    order: row.sort_order,
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

  await initStorage()
  const adapter = getRawStorage()
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
  await initStorage()
  const adapter = getRawStorage()
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

  // Todo Folders
  let foldersQuery = supabase.from('todo_folders').select('*').eq('user_id', userId)
  if (lastPullAt) foldersQuery = foldersQuery.gt('updated_at', lastPullAt)
  const { data: remoteFolders, error: fErr } = await foldersQuery
  if (fErr) throw fErr

  const localFolders = await adapter.getTodoFolders()
  const localFolderMap = new Map(localFolders.map((f) => [f.id, f]))

  for (const row of remoteFolders ?? []) {
    if (row.deleted_at) {
      if (localFolderMap.has(row.id)) await adapter.deleteTodoFolder(row.id)
      continue
    }
    const local = localFolderMap.get(row.id)
    if (!local) {
      await adapter.saveTodoFolder(rowToFolder(row))
    } else if (new Date(row.updated_at).getTime() >= new Date(local.updatedAt).getTime()) {
      await adapter.saveTodoFolder(rowToFolder(row))
    }
  }

  // Todo Lists
  let listsQuery = supabase.from('todo_lists').select('*').eq('user_id', userId)
  if (lastPullAt) listsQuery = listsQuery.gt('updated_at', lastPullAt)
  const { data: remoteLists, error: lErr } = await listsQuery
  if (lErr) throw lErr

  const localLists = await adapter.getTodoLists()
  const localListMap = new Map(localLists.map((l) => [l.id, l]))

  for (const row of remoteLists ?? []) {
    if (row.deleted_at) {
      if (localListMap.has(row.id)) await adapter.deleteTodoList(row.id)
      continue
    }
    const local = localListMap.get(row.id)
    if (!local) {
      await adapter.saveTodoList(rowToList(row))
    } else if (new Date(row.updated_at).getTime() >= new Date(local.updatedAt).getTime()) {
      await adapter.saveTodoList(rowToList(row))
    }
  }
}

async function push(
  userId: string,
  adapter: IStorageAdapter
): Promise<void> {
  const [reminders, notes, todos, folders, lists] = await Promise.all([
    adapter.getReminders(),
    adapter.getAllNotes(),
    adapter.getTodos(),
    adapter.getTodoFolders(),
    adapter.getTodoLists(),
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

  if (folders.length) {
    const { error } = await supabase.from('todo_folders').upsert(
      folders.map((f) => folderToRow(f, userId))
    )
    if (error) throw error
  }

  if (lists.length) {
    const { error } = await supabase.from('todo_lists').upsert(
      lists.map((l) => listToRow(l, userId))
    )
    if (error) throw error
  }
}
