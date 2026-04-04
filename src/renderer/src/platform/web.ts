import { openDB, deleteDB, type IDBPDatabase } from 'idb'
import type { IStorageAdapter } from './types'
import type { Reminder, Note, Todo, TodoFolder, TodoList } from '../types/models'

const DB_NAME = 'reminders-app'
const DB_VERSION = 2

export class WebAdapter implements IStorageAdapter {
  private db!: IDBPDatabase

  async init() {
    this.db = await this.openWithFallback()
    this.db.addEventListener('versionchange', () => this.db.close())
  }

  private async openWithFallback(): Promise<IDBPDatabase> {
    const upgrade = (db: IDBPDatabase, oldVersion: number) => {
      if (oldVersion < 1) {
        const reminders = db.createObjectStore('reminders', { keyPath: 'id' })
        reminders.createIndex('date', 'date')
        db.createObjectStore('notes', { keyPath: 'date' })
        const todos = db.createObjectStore('todos', { keyPath: 'id' })
        todos.createIndex('order', 'order')
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('todo_folders')) {
          const folders = db.createObjectStore('todo_folders', { keyPath: 'id' })
          folders.createIndex('order', 'order')
        }
        if (!db.objectStoreNames.contains('todo_lists')) {
          const lists = db.createObjectStore('todo_lists', { keyPath: 'id' })
          lists.createIndex('order', 'order')
        }
      }
    }

    // Race openDB against a 3-second timeout. If another tab is holding the
    // connection open and blocking the upgrade, wipe and recreate — Supabase
    // is the source of truth so local data loss is recoverable via sync.
    const race = await Promise.race([
      openDB(DB_NAME, DB_VERSION, { upgrade }).then((db) => ({ ok: true as const, db })),
      new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false }), 3000)),
    ])

    if (race.ok) return race.db

    await deleteDB(DB_NAME)
    return openDB(DB_NAME, DB_VERSION, { upgrade })
  }

  async getReminders(): Promise<Reminder[]> {
    return this.db.getAll('reminders')
  }

  async getRemindersByDate(date: string): Promise<Reminder[]> {
    return this.db.getAllFromIndex('reminders', 'date', date)
  }

  async saveReminder(r: Reminder): Promise<Reminder> {
    await this.db.put('reminders', r)
    return r
  }

  async deleteReminder(id: string): Promise<void> {
    await this.db.delete('reminders', id)
  }

  async getAllNotes(): Promise<Note[]> {
    return this.db.getAll('notes')
  }

  async getNoteByDate(date: string): Promise<Note | null> {
    return (await this.db.get('notes', date)) ?? null
  }

  async saveNote(n: Note): Promise<Note> {
    await this.db.put('notes', n)
    return n
  }

  async getTodos(): Promise<Todo[]> {
    return this.db.getAllFromIndex('todos', 'order')
  }

  async saveTodo(t: Todo): Promise<Todo> {
    await this.db.put('todos', t)
    return t
  }

  async deleteTodo(id: string): Promise<void> {
    await this.db.delete('todos', id)
  }

  async reorderTodos(orderedIds: string[]): Promise<void> {
    const tx = this.db.transaction('todos', 'readwrite')
    const all = await tx.store.getAll()
    const map = new Map(all.map((t: Todo) => [t.id, t]))
    for (let i = 0; i < orderedIds.length; i++) {
      const todo = map.get(orderedIds[i])
      if (todo) {
        todo.order = (i + 1) * 1000
        todo.updatedAt = new Date().toISOString()
        await tx.store.put(todo)
      }
    }
    await tx.done
  }

  async getTodoFolders(): Promise<TodoFolder[]> {
    return this.db.getAllFromIndex('todo_folders', 'order')
  }

  async saveTodoFolder(f: TodoFolder): Promise<TodoFolder> {
    await this.db.put('todo_folders', f)
    return f
  }

  async deleteTodoFolder(id: string): Promise<void> {
    await this.db.delete('todo_folders', id)
  }

  async getTodoLists(): Promise<TodoList[]> {
    return this.db.getAllFromIndex('todo_lists', 'order')
  }

  async saveTodoList(l: TodoList): Promise<TodoList> {
    await this.db.put('todo_lists', l)
    return l
  }

  async deleteTodoList(id: string): Promise<void> {
    await this.db.delete('todo_lists', id)
  }
}
