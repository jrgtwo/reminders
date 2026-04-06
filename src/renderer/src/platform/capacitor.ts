import type { IStorageAdapter } from './types'
import type {
  Reminder,
  Note,
  NoteFolder,
  TodoFolder,
  TodoList,
  TodoListItem
} from '../types/models'

// Stub — satisfies the interface but is not yet implemented.
// Complete this in Phase 10 using @capacitor-community/sqlite.
export class CapacitorAdapter implements IStorageAdapter {
  private notImplemented(): never {
    throw new Error('Capacitor storage not yet implemented')
  }

  getReminders(): Promise<Reminder[]> {
    return this.notImplemented()
  }
  getRemindersByDate(_date: string): Promise<Reminder[]> {
    return this.notImplemented()
  }
  saveReminder(_r: Reminder): Promise<Reminder> {
    return this.notImplemented()
  }
  deleteReminder(_id: string): Promise<void> {
    return this.notImplemented()
  }

  getAllNotes(): Promise<Note[]> {
    return this.notImplemented()
  }
  getNoteById(_id: string): Promise<Note | null> {
    return this.notImplemented()
  }
  saveNote(_n: Note): Promise<Note> {
    return this.notImplemented()
  }
  deleteNote(_id: string): Promise<void> {
    return this.notImplemented()
  }
  getNotesByFolder(_folderId: string): Promise<Note[]> {
    return this.notImplemented()
  }
  getNotesByDate(_date: string): Promise<Note[]> {
    return this.notImplemented()
  }

  getAllNoteFolders(): Promise<NoteFolder[]> {
    return this.notImplemented()
  }
  saveNoteFolder(_f: NoteFolder): Promise<NoteFolder> {
    return this.notImplemented()
  }
  deleteNoteFolder(_id: string): Promise<void> {
    return this.notImplemented()
  }

  getTodoFolders(): Promise<TodoFolder[]> {
    return this.notImplemented()
  }
  saveTodoFolder(_f: TodoFolder): Promise<TodoFolder> {
    return this.notImplemented()
  }
  deleteTodoFolder(_id: string): Promise<void> {
    return this.notImplemented()
  }

  getTodoLists(): Promise<TodoList[]> {
    return this.notImplemented()
  }
  saveTodoList(_l: TodoList): Promise<TodoList> {
    return this.notImplemented()
  }
  deleteTodoList(_id: string): Promise<void> {
    return this.notImplemented()
  }

  getTodoListItems(_listId: string): Promise<TodoListItem[]> {
    return this.notImplemented()
  }
  saveTodoListItem(_i: TodoListItem): Promise<TodoListItem> {
    return this.notImplemented()
  }
  deleteTodoListItem(_id: string): Promise<void> {
    return this.notImplemented()
  }
  reorderTodoListItems(_listId: string, _orderedIds: string[]): Promise<void> {
    return this.notImplemented()
  }
}
