import type { Reminder, Note, Todo, TodoFolder, TodoList } from '../types/models'

export interface IStorageAdapter {
  // Reminders
  getReminders(): Promise<Reminder[]>
  getRemindersByDate(date: string): Promise<Reminder[]>
  saveReminder(r: Reminder): Promise<Reminder>
  deleteReminder(id: string): Promise<void>

  // Notes
  getAllNotes(): Promise<Note[]>
  getNoteByDate(date: string): Promise<Note | null>
  saveNote(n: Note): Promise<Note>

  // Todos
  getTodos(): Promise<Todo[]>
  saveTodo(t: Todo): Promise<Todo>
  deleteTodo(id: string): Promise<void>
  reorderTodos(orderedIds: string[]): Promise<void>

  // Todo Folders
  getTodoFolders(): Promise<TodoFolder[]>
  saveTodoFolder(f: TodoFolder): Promise<TodoFolder>
  deleteTodoFolder(id: string): Promise<void>

  // Todo Lists
  getTodoLists(): Promise<TodoList[]>
  saveTodoList(l: TodoList): Promise<TodoList>
  deleteTodoList(id: string): Promise<void>
}