import { supabase } from './supabase'
import { generateKey, exportKey, importKey, encrypt, decrypt } from './encryption'
import { setEncryptionKey, cacheKey, getEncryptionKey } from './keyManager'
import { getRawStorage } from '../platform'
import type { Reminder, Note, TodoFolder, TodoList, TodoListItem } from '../types/models'

// --- Progress tracking ---

const PROGRESS_KEY = 'key_rotation_progress'
const OLD_KEY_BACKUP = 'key_rotation_old_key'

interface RotationProgress {
  newKeyData: string
  completedTables: string[]
}

function saveProgress(progress: RotationProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

function loadProgress(): RotationProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearProgress(): void {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(OLD_KEY_BACKUP)
}

// --- Supabase row formatters (mirrors webSync.ts) ---

function reminderRow(r: Reminder, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    description: r.description ?? null,
    date: r.date,
    start_time: r.startTime ?? null,
    end_time: r.endTime ?? null,
    recurrence: r.recurrence ? JSON.stringify(r.recurrence) : null,
    completed_dates: JSON.stringify(r.completedDates),
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

function noteRow(n: Note, userId: string) {
  return {
    date: n.date,
    user_id: userId,
    content: n.content,
    updated_at: n.updatedAt,
    display_order: n.displayOrder,
  }
}

function folderRow(f: TodoFolder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    sort_order: f.order,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
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
    updated_at: l.updatedAt,
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
    updated_at: i.updatedAt,
  }
}

// --- Re-encrypt helpers (decrypt with old key, encrypt with new key) ---

async function reEncrypt(
  oldKey: CryptoKey,
  newKey: CryptoKey,
  text: string,
): Promise<string> {
  const plain = await decrypt(oldKey, text)
  return encrypt(newKey, plain)
}

async function reEncryptOpt(
  oldKey: CryptoKey,
  newKey: CryptoKey,
  text: string | undefined,
): Promise<string | undefined> {
  if (text === undefined) return undefined
  return reEncrypt(oldKey, newKey, text)
}

// ---

export async function rotateEncryptionKey(userId: string): Promise<void> {
  const raw = getRawStorage()
  const oldKey = getEncryptionKey()
  if (!oldKey) throw new Error('No active encryption key to rotate from')

  // 1. Back up the old key locally before anything else
  const oldKeyRaw = await exportKey(oldKey)
  localStorage.setItem(OLD_KEY_BACKUP, oldKeyRaw)

  // 2. Check for in-progress rotation (resume support)
  let progress = loadProgress()
  let newKey: CryptoKey
  let newKeyData: string

  if (progress) {
    // Resuming a previous rotation
    newKeyData = progress.newKeyData
    newKey = await importKey(newKeyData)
  } else {
    // Fresh rotation
    newKey = await generateKey()
    newKeyData = await exportKey(newKey)
    progress = { newKeyData, completedTables: [] }
    saveProgress(progress)
  }

  // 3. Re-encrypt each table one record at a time, writing to local storage as we go.
  //    Collect re-encrypted records for Supabase push after all local writes succeed.

  const supabaseBatches: {
    reminders: ReturnType<typeof reminderRow>[]
    notes: ReturnType<typeof noteRow>[]
    todoFolders: ReturnType<typeof folderRow>[]
    todoLists: ReturnType<typeof listRow>[]
    todoListItems: ReturnType<typeof listItemRow>[]
  } = { reminders: [], notes: [], todoFolders: [], todoLists: [], todoListItems: [] }

  // -- Reminders --
  if (!progress.completedTables.includes('reminders')) {
    const reminders = await raw.getReminders()
    for (const r of reminders) {
      const reEnc: Reminder = {
        ...r,
        title: await reEncrypt(oldKey, newKey, r.title),
        description: await reEncryptOpt(oldKey, newKey, r.description),
      }
      await raw.saveReminder(reEnc)
      supabaseBatches.reminders.push(reminderRow(reEnc, userId))
    }
    progress.completedTables.push('reminders')
    saveProgress(progress)
  }

  // -- Notes --
  if (!progress.completedTables.includes('notes')) {
    const notes = await raw.getAllNotes()
    for (const n of notes) {
      const reEnc: Note = {
        ...n,
        content: await reEncrypt(oldKey, newKey, n.content),
      }
      await raw.saveNote(reEnc)
      supabaseBatches.notes.push(noteRow(reEnc, userId))
    }
    progress.completedTables.push('notes')
    saveProgress(progress)
  }

  // -- Todo Folders --
  if (!progress.completedTables.includes('todoFolders')) {
    const folders = await raw.getTodoFolders()
    for (const f of folders) {
      const reEnc: TodoFolder = {
        ...f,
        name: await reEncrypt(oldKey, newKey, f.name),
      }
      await raw.saveTodoFolder(reEnc)
      supabaseBatches.todoFolders.push(folderRow(reEnc, userId))
    }
    progress.completedTables.push('todoFolders')
    saveProgress(progress)
  }

  // -- Todo Lists --
  if (!progress.completedTables.includes('todoLists')) {
    const lists = await raw.getTodoLists()
    for (const l of lists) {
      const reEnc: TodoList = {
        ...l,
        name: await reEncrypt(oldKey, newKey, l.name),
      }
      await raw.saveTodoList(reEnc)
      supabaseBatches.todoLists.push(listRow(reEnc, userId))
    }
    progress.completedTables.push('todoLists')
    saveProgress(progress)
  }

  // -- Todo List Items --
  if (!progress.completedTables.includes('todoListItems')) {
    const lists = await raw.getTodoLists()
    for (const l of lists) {
      const items = await raw.getTodoListItems(l.id)
      for (const i of items) {
        const reEnc: TodoListItem = {
          ...i,
          title: await reEncrypt(oldKey, newKey, i.title),
          description: await reEncryptOpt(oldKey, newKey, i.description),
        }
        await raw.saveTodoListItem(reEnc)
        supabaseBatches.todoListItems.push(listItemRow(reEnc, userId))
      }
    }
    progress.completedTables.push('todoListItems')
    saveProgress(progress)
  }

  // 4. All local re-encryption succeeded. Push to Supabase.
  const pushes: PromiseLike<unknown>[] = []
  if (supabaseBatches.reminders.length)
    pushes.push(supabase.from('reminders').upsert(supabaseBatches.reminders).select())
  if (supabaseBatches.notes.length)
    pushes.push(supabase.from('notes').upsert(supabaseBatches.notes).select())
  if (supabaseBatches.todoFolders.length)
    pushes.push(supabase.from('todo_folders').upsert(supabaseBatches.todoFolders).select())
  if (supabaseBatches.todoLists.length)
    pushes.push(supabase.from('todo_lists').upsert(supabaseBatches.todoLists).select())
  if (supabaseBatches.todoListItems.length)
    pushes.push(
      supabase.from('todo_list_items').upsert(supabaseBatches.todoListItems).select(),
    )
  await Promise.all(pushes)

  // 5. Update the key in Supabase
  const { error } = await supabase
    .from('user_keys')
    .update({ key_data: newKeyData })
    .eq('user_id', userId)
  if (error) throw new Error('Failed to update encryption key in Supabase')

  // 6. Everything succeeded — swap in-memory key and clean up
  setEncryptionKey(newKey)
  await cacheKey(userId, newKeyData)
  clearProgress()
}
