import type { Reminder, Note, Todo } from '../types/models'

export interface IStorageAdapter {
  // Reminders
  getReminders(): Promise<Reminder[]>
  getRemindersByDate(date: string): Promise<Reminder[]>
  saveReminder(r: Reminder): Promise<Reminder>
  deleteReminder(id: string): Promise<void>

  // Notes
  getNoteByDate(date: string): Promise<Note | null>
  saveNote(n: Note): Promise<Note>

  // Todos
  getTodos(): Promise<Todo[]>
  saveTodo(t: Todo): Promise<Todo>
  deleteTodo(id: string): Promise<void>
reorderTodos(orderedIds: string[]): Promise<void>
}