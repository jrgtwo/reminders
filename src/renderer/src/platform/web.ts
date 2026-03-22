import { openDB, type IDBPDatabase } from 'idb'
 import type { IStorageAdapter } from './types'
 import type { Reminder, Note, Todo } from '../types/models'

 const DB_NAME = 'reminders-app'
 const DB_VERSION = 1

 export class WebAdapter implements IStorageAdapter {
   private db!: IDBPDatabase

   async init() {
     this.db = await openDB(DB_NAME, DB_VERSION, {
       upgrade(db) {
         const reminders = db.createObjectStore('reminders', { keyPath: 'id' })
         reminders.createIndex('date', 'date')
         db.createObjectStore('notes', { keyPath: 'date' })
         const todos = db.createObjectStore('todos', { keyPath: 'id' })
         todos.createIndex('order', 'order')
       },
     })
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
 }