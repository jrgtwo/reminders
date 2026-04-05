import { openDB, deleteDB, type IDBPDatabase } from 'idb'
import type { IStorageAdapter } from './types'
import type { Reminder, Note, TodoFolder, TodoList, TodoListItem } from '../types/models'

const DB_NAME = 'reminders-app'
const DB_VERSION = 3

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
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('todo_list_items')) {
          const items = db.createObjectStore('todo_list_items', { keyPath: 'id' })
          items.createIndex('listId', 'listId')
        }
      }
    }

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

  async getTodoListItems(listId: string): Promise<TodoListItem[]> {
    const all = await this.db.getAllFromIndex('todo_list_items', 'listId', listId)
    return all.sort((a: TodoListItem, b: TodoListItem) => a.order - b.order)
  }

  async saveTodoListItem(item: TodoListItem): Promise<TodoListItem> {
    await this.db.put('todo_list_items', item)
    return item
  }

  async deleteTodoListItem(id: string): Promise<void> {
    await this.db.delete('todo_list_items', id)
  }

  async reorderTodoListItems(listId: string, orderedIds: string[]): Promise<void> {
    const tx = this.db.transaction('todo_list_items', 'readwrite')
    const now = new Date().toISOString()
    await Promise.all(
      orderedIds.map(async (id, i) => {
        const item = await tx.store.get(id)
        if (item && item.listId === listId) {
          item.order = (i + 1) * 1000
          item.updatedAt = now
          await tx.store.put(item)
        }
      })
    )
    await tx.done
  }

  async clearAll(): Promise<void> {
    const stores = ['reminders', 'notes', 'todos', 'todo_folders', 'todo_lists', 'todo_list_items'] as const
    const tx = this.db.transaction([...stores], 'readwrite')
    await Promise.all(stores.map((name) => tx.objectStore(name).clear()))
    await tx.done
  }
}
