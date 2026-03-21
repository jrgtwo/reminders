  import type { IStorageAdapter } from './types'
  import type { Reminder, Note, Todo } from '../types/models'

  // Calls window.electronAPI exposed by the preload contextBridge
  export class ElectronAdapter implements IStorageAdapter {
    private api = (window as any).electronAPI

    getReminders(): Promise<Reminder[]> { return this.api.reminders.getAll() }
    getRemindersByDate(date: string): Promise<Reminder[]> { return this.api.reminders.getByDate(date) }
    saveReminder(r: Reminder): Promise<Reminder> { return this.api.reminders.save(r) }
    deleteReminder(id: string): Promise<void> { return this.api.reminders.delete(id) }

    getNoteByDate(date: string): Promise<Note | null> { return this.api.notes.getByDate(date) }
    saveNote(n: Note): Promise<Note> { return this.api.notes.save(n) }

    getTodos(): Promise<Todo[]> { return this.api.todos.getAll() }
    saveTodo(t: Todo): Promise<Todo> { return this.api.todos.save(t) }
    deleteTodo(id: string): Promise<void> { return this.api.todos.delete(id) }
    reorderTodos(orderedIds: string[]): Promise<void> { return this.api.todos.reorder(orderedIds) }
  }