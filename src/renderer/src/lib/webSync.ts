import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { initStorage, getRawStorage } from '../platform'
import { wasEncryptionKeyChanged, clearEncryptionKeyChangedFlag } from './keyManager'
import type { IStorageAdapter } from '../platform/types'
import type {
  Reminder,
  Note,
  NoteFolder,
  TodoFolder,
  TodoList,
  TodoListItem
} from '../types/models'

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
    updated_at: r.updatedAt
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
    updatedAt: row.updated_at
  }
}

function noteToRow(n: Note, userId: string) {
  return {
    id: n.id,
    user_id: userId,
    title: n.title,
    content: n.content,
    folder_id: n.folderId ?? null,
    due_date: n.date ?? null,
    display_order: n.displayOrder,
    created_at: n.createdAt,
    updated_at: n.updatedAt
  }
}

function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id ?? undefined,
    date: row.due_date ?? undefined,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function noteFolderToRow(f: NoteFolder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    display_order: f.displayOrder,
    created_at: f.createdAt,
    updated_at: f.updatedAt
  }
}

function rowToNoteFolder(row: any): NoteFolder {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function folderToRow(f: TodoFolder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    sort_order: f.order,
    created_at: f.createdAt,
    updated_at: f.updatedAt
  }
}

function rowToFolder(row: any): TodoFolder {
  return {
    id: row.id,
    name: row.name,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function listToRow(l: TodoList, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    name: l.name,
    folder_id: l.folderId ?? null,
    due_date: l.dueDate ?? null,
    sort_order: l.order,
    created_at: l.createdAt,
    updated_at: l.updatedAt
  }
}

function rowToList(row: any): TodoList {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function listItemToRow(i: TodoListItem, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    list_id: i.listId,
    title: i.title,
    description: i.description ?? null,
    sort_order: i.order,
    completed: i.completed ? 1 : 0,
    completed_at: i.completedAt ?? null,
    created_at: i.createdAt,
    updated_at: i.updatedAt
  }
}

function rowToListItem(row: any): TodoListItem {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description ?? undefined,
    order: row.sort_order,
    completed: !!row.completed,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
  const [reminders, notes, lists] = await Promise.all([
    adapter.getReminders(),
    adapter.getAllNotes(),
    adapter.getTodoLists()
  ])
  const hasLocal = reminders.length + notes.length + lists.length > 0

  const [{ count: rc }, { count: nc }, { count: lc }] = await Promise.all([
    supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('todo_lists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)
  ])
  const hasRemote = (rc ?? 0) + (nc ?? 0) + (lc ?? 0) > 0

  return { isFirstLogin: true, hasLocal, hasRemote }
}

export function webMarkFirstLoginDone(userId: string): void {
  localStorage.setItem(FIRST_LOGIN_KEY(userId), '1')
}

// --- Reset from cloud ---

/**
 * Clear all local data and do a full pull from Supabase — no push.
 */
export async function webResetFromCloud(session: Session): Promise<{ lastSyncedAt: string }> {
  const userId = session.user.id
  await initStorage()
  const adapter = getRawStorage()

  if (adapter.clearAll) await adapter.clearAll()
  localStorage.removeItem(LAST_PULL_KEY(userId))

  await pull(userId, null, adapter)

  const now = new Date().toISOString()
  localStorage.setItem(LAST_PULL_KEY(userId), now)
  return { lastSyncedAt: now }
}

// --- Soft-delete propagation ---

export async function webSoftDelete(
  table: 'reminders' | 'notes' | 'note_folders' | 'todo_folders' | 'todo_lists',
  id: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString()
  await supabase
    .from(table)
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId)
}

// --- Sync ---

export async function webSync(session: Session): Promise<{ lastSyncedAt: string }> {
  const userId = session.user.id
  await initStorage()
  const adapter = getRawStorage()

  if (wasEncryptionKeyChanged(userId)) {
    console.log('[sync] encryption key changed — clearing local data for fresh pull')
    if (typeof adapter.clearAll === 'function') await adapter.clearAll()
    localStorage.removeItem(LAST_PULL_KEY(userId))
    localStorage.removeItem(FIRST_LOGIN_KEY(userId))
    clearEncryptionKeyChangedFlag(userId)
  }

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

  const localNotes = await adapter.getAllNotes()
  const localNoteMap = new Map(localNotes.map((n) => [n.id, n]))

  for (const row of remoteNotes ?? []) {
    if (row.deleted_at) {
      if (localNoteMap.has(row.id)) await adapter.deleteNote(row.id)
      continue
    }
    const local = localNoteMap.get(row.id)
    if (!local) {
      await adapter.saveNote(rowToNote(row))
    } else {
      const remoteTs = new Date(row.updated_at).getTime()
      const localTs = new Date(local.updatedAt).getTime()
      if (remoteTs >= localTs) {
        await adapter.saveNote(rowToNote(row))
      }
    }
  }

  // Note Folders
  let noteFoldersQuery = supabase.from('note_folders').select('*').eq('user_id', userId)
  if (lastPullAt) noteFoldersQuery = noteFoldersQuery.gt('updated_at', lastPullAt)
  const { data: remoteNoteFolders, error: nfErr } = await noteFoldersQuery
  if (nfErr) throw nfErr

  const localNoteFolders = await adapter.getAllNoteFolders()
  const localNoteFolderMap = new Map(localNoteFolders.map((f) => [f.id, f]))

  for (const row of remoteNoteFolders ?? []) {
    if (row.deleted_at) {
      if (localNoteFolderMap.has(row.id)) await adapter.deleteNoteFolder(row.id)
      continue
    }
    const local = localNoteFolderMap.get(row.id) as NoteFolder | undefined
    if (!local) {
      await adapter.saveNoteFolder(rowToNoteFolder(row))
    } else if (new Date(row.updated_at).getTime() >= new Date(local.updatedAt).getTime()) {
      await adapter.saveNoteFolder(rowToNoteFolder(row))
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

  // Todo List Items — table may not exist in all environments yet; skip gracefully
  try {
    let itemsQuery = supabase.from('todo_list_items').select('*').eq('user_id', userId)
    if (lastPullAt) itemsQuery = itemsQuery.gt('updated_at', lastPullAt)
    const { data: remoteItems, error: iErr } = await itemsQuery
    if (!iErr) {
      for (const row of remoteItems ?? []) {
        if (row.deleted_at) {
          await adapter.deleteTodoListItem(row.id)
          continue
        }
        await adapter.saveTodoListItem(rowToListItem(row))
      }
    }
  } catch {
    // table not yet created — items are local-only until Supabase schema is updated
  }
}

async function push(userId: string, adapter: IStorageAdapter): Promise<void> {
  const [reminders, notes, noteFolders, folders, lists] = await Promise.all([
    adapter.getReminders(),
    adapter.getAllNotes(),
    adapter.getAllNoteFolders(),
    adapter.getTodoFolders(),
    adapter.getTodoLists()
  ])

  if (reminders.length) {
    const { error } = await supabase
      .from('reminders')
      .upsert(reminders.map((r) => reminderToRow(r, userId)))
    if (error) throw error
  }

  if (notes.length) {
    const { error } = await supabase.from('notes').upsert(notes.map((n) => noteToRow(n, userId)))
    if (error) throw error
  }

  if (noteFolders.length) {
    const { error } = await supabase
      .from('note_folders')
      .upsert(noteFolders.map((f) => noteFolderToRow(f, userId)))
    if (error) throw error
  }

  if (folders.length) {
    const { error } = await supabase
      .from('todo_folders')
      .upsert(folders.map((f) => folderToRow(f, userId)))
    if (error) throw error
  }

  if (lists.length) {
    const { error } = await supabase
      .from('todo_lists')
      .upsert(lists.map((l) => listToRow(l, userId)))
    if (error) throw error
  }

  // Push items — table may not exist yet; skip gracefully
  try {
    const allItems: TodoListItem[] = (
      await Promise.all(lists.map((l) => adapter.getTodoListItems(l.id)))
    ).flat()
    if (allItems.length) {
      const { error } = await supabase
        .from('todo_list_items')
        .upsert(allItems.map((i) => listItemToRow(i, userId)))
      if (error && (error as any).code !== 'PGRST205') throw error
    }
  } catch (e: any) {
    if (e?.code !== 'PGRST205') throw e
  }
}
