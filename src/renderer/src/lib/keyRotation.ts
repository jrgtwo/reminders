import { supabase } from './supabase'
import { generateKey, exportKey, encrypt } from './encryption'
import { setEncryptionKey, cacheKey } from './keyManager'
import { getStorage, getRawStorage } from '../platform'
import type { Reminder, Note, TodoFolder, TodoList, TodoListItem } from '../types/models'

// --- Supabase row formatters (mirrors webSync.ts) ---

function reminderRow(r: Reminder, userId: string) {
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

function noteRow(n: Note, userId: string) {
  return {
    date: n.date,
    user_id: userId,
    content: n.content,
    updated_at: n.updatedAt,
    display_order: n.displayOrder
  }
}

function folderRow(f: TodoFolder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    sort_order: f.order,
    created_at: f.createdAt,
    updated_at: f.updatedAt
  }
}

function listRow(l: TodoList, userId: string) {
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

function listItemRow(i: TodoListItem, userId: string) {
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

// ---

export async function rotateEncryptionKey(userId: string): Promise<void> {
  const enc = getStorage()
  const raw = getRawStorage()

  // 1. Load everything decrypted with the current key
  const lists = await enc.getTodoLists()
  const [reminders, notes, folders] = await Promise.all([
    enc.getReminders(),
    enc.getAllNotes(),
    enc.getTodoFolders()
  ])
  const allItems: TodoListItem[] = (
    await Promise.all(lists.map((l) => enc.getTodoListItems(l.id)))
  ).flat()

  // 2. Generate new key
  const newKey = await generateKey()
  const newKeyData = await exportKey(newKey)

  const ef = (text: string) => encrypt(newKey, text)
  const efOpt = (text: string | undefined) =>
    text !== undefined ? encrypt(newKey, text) : Promise.resolve(undefined)

  // 3. Re-encrypt all records in memory
  const encReminders = await Promise.all(
    reminders.map(async (r) => ({
      ...r,
      title: await ef(r.title),
      description: await efOpt(r.description)
    }))
  )
  const encNotes = await Promise.all(
    notes.map(async (n) => ({ ...n, content: await ef(n.content) }))
  )
  const encFolders = await Promise.all(folders.map(async (f) => ({ ...f, name: await ef(f.name) })))
  const encLists = await Promise.all(lists.map(async (l) => ({ ...l, name: await ef(l.name) })))
  const encItems = await Promise.all(
    allItems.map(async (i) => ({
      ...i,
      title: await ef(i.title),
      description: await efOpt(i.description)
    }))
  )

  // 4. Push re-encrypted data to Supabase BEFORE updating the key.
  const pushes: Promise<any>[] = []
  if (encReminders.length)
    pushes.push(supabase.from('reminders').upsert(encReminders.map((r) => reminderRow(r, userId))))
  if (encNotes.length)
    pushes.push(supabase.from('notes').upsert(encNotes.map((n) => noteRow(n, userId))))
  if (encFolders.length)
    pushes.push(supabase.from('todo_folders').upsert(encFolders.map((f) => folderRow(f, userId))))
  if (encLists.length)
    pushes.push(supabase.from('todo_lists').upsert(encLists.map((l) => listRow(l, userId))))
  if (encItems.length)
    pushes.push(
      supabase.from('todo_list_items').upsert(encItems.map((i) => listItemRow(i, userId)))
    )
  await Promise.all(pushes)

  // 5. Now update the key in Supabase — data is already in new-key format
  const { error } = await supabase
    .from('user_keys')
    .update({ key_data: newKeyData })
    .eq('user_id', userId)
  if (error) throw new Error('Failed to update encryption key')

  // 6. Update local raw storage
  await Promise.all([
    ...encReminders.map((r) => raw.saveReminder(r)),
    ...encNotes.map((n) => raw.saveNote(n)),
    ...encFolders.map((f) => raw.saveTodoFolder(f)),
    ...encLists.map((l) => raw.saveTodoList(l)),
    ...encItems.map((i) => raw.saveTodoListItem(i))
  ])

  // 7. Swap in-memory key and update local cache
  setEncryptionKey(newKey)
  await cacheKey(userId, newKeyData)
}
