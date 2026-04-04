import { supabase } from './supabase'
import { generateKey, exportKey, encrypt } from './encryption'
import { setEncryptionKey, cacheKey } from './keyManager'
import { getStorage, getRawStorage } from '../platform'

export async function rotateEncryptionKey(userId: string): Promise<void> {
  const enc = getStorage()
  const raw = getRawStorage()

  // 1. Load everything decrypted with the current key
  const [reminders, notes, todos, folders, lists] = await Promise.all([
    enc.getReminders(),
    enc.getAllNotes(),
    enc.getTodos(),
    enc.getTodoFolders(),
    enc.getTodoLists(),
  ])

  // 2. Generate new key
  const newKey = await generateKey()
  const newKeyData = await exportKey(newKey)

  const ef = (text: string) => encrypt(newKey, text)
  const efOpt = (text: string | undefined) =>
    text !== undefined ? encrypt(newKey, text) : Promise.resolve(undefined)

  // 3. Re-save all records to raw storage encrypted with the new key.
  //    Raw storage bypasses the EncryptedAdapter so there's no double-encrypt.
  await Promise.all([
    ...reminders.map((r) =>
      ef(r.title).then((title) =>
        efOpt(r.description).then((description) =>
          raw.saveReminder({ ...r, title, description }),
        ),
      ),
    ),
    ...notes.map((n) => ef(n.content).then((content) => raw.saveNote({ ...n, content }))),
    ...todos.map((t) =>
      ef(t.title).then((title) =>
        efOpt(t.description).then((description) =>
          raw.saveTodo({ ...t, title, description }),
        ),
      ),
    ),
    ...folders.map((f) => ef(f.name).then((name) => raw.saveTodoFolder({ ...f, name }))),
    ...lists.map((l) => ef(l.name).then((name) => raw.saveTodoList({ ...l, name }))),
  ])

  // 4. Update Supabase with the new key
  const { error } = await supabase
    .from('user_keys')
    .update({ key_data: newKeyData })
    .eq('user_id', userId)
  if (error) throw new Error('Failed to update encryption key')

  // 5. Swap in-memory key and update local cache
  setEncryptionKey(newKey)
  await cacheKey(userId, newKeyData)
}
