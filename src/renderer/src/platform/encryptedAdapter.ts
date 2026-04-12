import type { IStorageAdapter } from './types'
import type {
  Reminder,
  Note,
  NoteFolder,
  TodoFolder,
  TodoList,
  TodoListItem
} from '../types/models'
import { encrypt, decrypt } from '../lib/encryption'

export class EncryptedAdapter implements IStorageAdapter {
  constructor(
    private inner: IStorageAdapter,
    private getKey: () => CryptoKey | null
  ) {}

  // --- Helpers ---

  private async enc(text: string): Promise<string>
  private async enc(text: string | undefined): Promise<string | undefined>
  private async enc(text: string | undefined): Promise<string | undefined> {
    if (text === undefined) return undefined
    const key = this.getKey()
    if (!key) return text
    return encrypt(key, text)
  }

  private async dec(text: string): Promise<string>
  private async dec(text: string | undefined): Promise<string | undefined>
  private async dec(text: string | undefined): Promise<string | undefined> {
    if (text === undefined) return undefined
    const key = this.getKey()
    if (!key) {
      // No key available — never expose raw ciphertext to the UI.
      // Return plaintext as-is; return empty string for encrypted data.
      return text.startsWith('enc:') ? '' : text
    }
    try {
      return await decrypt(key, text)
    } catch (err) {
      console.error('[encryption] decrypt failed — data may be encrypted with a stale key:', err)
      return ''
    }
  }

  // --- Reminders ---

  async getReminders(): Promise<Reminder[]> {
    return Promise.all((await this.inner.getReminders()).map((r) => this.decR(r)))
  }

  async getRemindersByDate(date: string): Promise<Reminder[]> {
    return Promise.all((await this.inner.getRemindersByDate(date)).map((r) => this.decR(r)))
  }

  async saveReminder(r: Reminder): Promise<Reminder> {
    const saved = await this.inner.saveReminder(await this.encR(r))
    return this.decR(saved)
  }

  deleteReminder(id: string): Promise<void> {
    return this.inner.deleteReminder(id)
  }

  private async encR(r: Reminder): Promise<Reminder> {
    return { ...r, title: await this.enc(r.title), description: await this.enc(r.description) }
  }

  private async decR(r: Reminder): Promise<Reminder> {
    return { ...r, title: await this.dec(r.title), description: await this.dec(r.description) }
  }

  // --- Notes ---

  async getAllNotes(): Promise<Note[]> {
    return Promise.all((await this.inner.getAllNotes()).map((n) => this.decN(n)))
  }

  async getNoteById(id: string): Promise<Note | null> {
    const n = await this.inner.getNoteById(id)
    return n ? this.decN(n) : null
  }

  async saveNote(n: Note): Promise<Note> {
    const saved = await this.inner.saveNote(await this.encN(n))
    return this.decN(saved)
  }

  async deleteNote(id: string): Promise<void> {
    await this.inner.deleteNote(id)
  }

  async getNotesByFolder(folderId: string): Promise<Note[]> {
    return Promise.all((await this.inner.getNotesByFolder(folderId)).map((n) => this.decN(n)))
  }

  async getNotesByDate(date: string): Promise<Note[]> {
    return Promise.all((await this.inner.getNotesByDate(date)).map((n) => this.decN(n)))
  }

  private async encN(n: Note): Promise<Note> {
    return { ...n, content: await this.enc(n.content) }
  }

  private async decN(n: Note): Promise<Note> {
    return { ...n, content: await this.dec(n.content) }
  }

  // --- Note Folders ---

  async getAllNoteFolders(): Promise<NoteFolder[]> {
    return await this.inner.getAllNoteFolders()
  }

  async saveNoteFolder(f: NoteFolder): Promise<NoteFolder> {
    return await this.inner.saveNoteFolder(f)
  }

  async deleteNoteFolder(id: string): Promise<void> {
    await this.inner.deleteNoteFolder(id)
  }

  // --- Todo Folders ---

  async getTodoFolders(): Promise<TodoFolder[]> {
    return Promise.all((await this.inner.getTodoFolders()).map((f) => this.decF(f)))
  }

  async saveTodoFolder(f: TodoFolder): Promise<TodoFolder> {
    const saved = await this.inner.saveTodoFolder({ ...f, name: await this.enc(f.name) })
    return this.decF(saved)
  }

  deleteTodoFolder(id: string): Promise<void> {
    return this.inner.deleteTodoFolder(id)
  }

  private async decF(f: TodoFolder): Promise<TodoFolder> {
    return { ...f, name: await this.dec(f.name) }
  }

  // --- Todo Lists ---

  async getTodoLists(): Promise<TodoList[]> {
    return Promise.all((await this.inner.getTodoLists()).map((l) => this.decL(l)))
  }

  async saveTodoList(l: TodoList): Promise<TodoList> {
    const saved = await this.inner.saveTodoList({ ...l, name: await this.enc(l.name) })
    return this.decL(saved)
  }

  deleteTodoList(id: string): Promise<void> {
    return this.inner.deleteTodoList(id)
  }

  private async decL(l: TodoList): Promise<TodoList> {
    return { ...l, name: await this.dec(l.name) }
  }

  // --- Todo List Items ---

  async getTodoListItems(listId: string): Promise<TodoListItem[]> {
    return Promise.all((await this.inner.getTodoListItems(listId)).map((i) => this.decI(i)))
  }

  async saveTodoListItem(item: TodoListItem): Promise<TodoListItem> {
    const saved = await this.inner.saveTodoListItem(await this.encI(item))
    return this.decI(saved)
  }

  deleteTodoListItem(id: string): Promise<void> {
    return this.inner.deleteTodoListItem(id)
  }

  reorderTodoListItems(listId: string, orderedIds: string[]): Promise<void> {
    return this.inner.reorderTodoListItems(listId, orderedIds)
  }

  private async encI(item: TodoListItem): Promise<TodoListItem> {
    return {
      ...item,
      title: await this.enc(item.title),
      description: await this.enc(item.description)
    }
  }

  private async decI(item: TodoListItem): Promise<TodoListItem> {
    return {
      ...item,
      title: await this.dec(item.title),
      description: await this.dec(item.description)
    }
  }
}
