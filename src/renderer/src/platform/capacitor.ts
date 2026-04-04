import type { IStorageAdapter } from './types'
  import type { Reminder, Note, Todo, TodoFolder, TodoList } from '../types/models'

  // Stub — satisfies the interface but is not yet implemented.
  // Complete this in Phase 10 using @capacitor-community/sqlite.
  export class CapacitorAdapter implements IStorageAdapter {
    private notImplemented(): never {
      throw new Error('Capacitor storage not yet implemented')
    }

    getReminders(): Promise<Reminder[]> { return this.notImplemented() }
    getRemindersByDate(_date: string): Promise<Reminder[]> { return this.notImplemented() }
    saveReminder(_r: Reminder): Promise<Reminder> { return this.notImplemented() }
    deleteReminder(_id: string): Promise<void> { return this.notImplemented() }

    getAllNotes(): Promise<Note[]> { return this.notImplemented() }
    getNoteByDate(_date: string): Promise<Note | null> { return this.notImplemented() }
    saveNote(_n: Note): Promise<Note> { return this.notImplemented() }

    getTodos(): Promise<Todo[]> { return this.notImplemented() }
    saveTodo(_t: Todo): Promise<Todo> { return this.notImplemented() }
    deleteTodo(_id: string): Promise<void> { return this.notImplemented() }
    reorderTodos(_orderedIds: string[]): Promise<void> { return this.notImplemented() }

    getTodoFolders(): Promise<TodoFolder[]> { return this.notImplemented() }
    saveTodoFolder(_f: TodoFolder): Promise<TodoFolder> { return this.notImplemented() }
    deleteTodoFolder(_id: string): Promise<void> { return this.notImplemented() }

    getTodoLists(): Promise<TodoList[]> { return this.notImplemented() }
    saveTodoList(_l: TodoList): Promise<TodoList> { return this.notImplemented() }
    deleteTodoList(_id: string): Promise<void> { return this.notImplemented() }
  }