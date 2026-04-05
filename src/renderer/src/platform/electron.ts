import type { IStorageAdapter } from './types'
import type { Reminder, Note, TodoFolder, TodoList, TodoListItem } from '../types/models'

// Calls window.electronAPI exposed by the preload contextBridge
export class ElectronAdapter implements IStorageAdapter {
  private api = (window as any).electronAPI

  getReminders(): Promise<Reminder[]> { return this.api.reminders.getAll() }
  getRemindersByDate(date: string): Promise<Reminder[]> { return this.api.reminders.getByDate(date) }
  saveReminder(r: Reminder): Promise<Reminder> { return this.api.reminders.save(r) }
  deleteReminder(id: string): Promise<void> { return this.api.reminders.delete(id) }

  getAllNotes(): Promise<Note[]> { return this.api.notes.getAll() }
  getNoteByDate(date: string): Promise<Note | null> { return this.api.notes.getByDate(date) }
  saveNote(n: Note): Promise<Note> { return this.api.notes.save(n) }

  getTodoFolders(): Promise<TodoFolder[]> { return this.api.todoFolders.getAll() }
  saveTodoFolder(f: TodoFolder): Promise<TodoFolder> { return this.api.todoFolders.save(f) }
  deleteTodoFolder(id: string): Promise<void> { return this.api.todoFolders.delete(id) }

  getTodoLists(): Promise<TodoList[]> { return this.api.todoLists.getAll() }
  saveTodoList(l: TodoList): Promise<TodoList> { return this.api.todoLists.save(l) }
  deleteTodoList(id: string): Promise<void> { return this.api.todoLists.delete(id) }

  getTodoListItems(listId: string): Promise<TodoListItem[]> { return this.api.todoLists.getAllItemsForList(listId) }
  saveTodoListItem(item: TodoListItem): Promise<TodoListItem> { return this.api.todoLists.saveItem(item) }
  deleteTodoListItem(id: string): Promise<void> { return this.api.todoLists.deleteItem(id) }
  reorderTodoListItems(listId: string, orderedIds: string[]): Promise<void> { return this.api.todoLists.reorderItems(listId, orderedIds) }
}
