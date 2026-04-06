import type {
  Reminder,
  Note,
  NoteFolder,
  TodoFolder,
  TodoList,
  TodoListItem
} from '../types/models'

export interface IStorageAdapter {
  // Reminders
  getReminders(): Promise<Reminder[]>
  getRemindersByDate(date: string): Promise<Reminder[]>
  saveReminder(r: Reminder): Promise<Reminder>
  deleteReminder(id: string): Promise<void>

  // Notes
  getAllNotes(): Promise<Note[]>
  getNoteById(id: string): Promise<Note | null>
  saveNote(n: Note): Promise<Note>
  deleteNote(id: string): Promise<void>
  getNotesByFolder(folderId: string): Promise<Note[]>
  getNotesByDate(date: string): Promise<Note[]>

  // Note Folders
  getAllNoteFolders(): Promise<NoteFolder[]>
  saveNoteFolder(f: NoteFolder): Promise<NoteFolder>
  deleteNoteFolder(id: string): Promise<void>

  // Todo Folders
  getTodoFolders(): Promise<TodoFolder[]>
  saveTodoFolder(f: TodoFolder): Promise<TodoFolder>
  deleteTodoFolder(id: string): Promise<void>

  // Todo Lists
  getTodoLists(): Promise<TodoList[]>
  saveTodoList(l: TodoList): Promise<TodoList>
  deleteTodoList(id: string): Promise<void>

  // Todo List Items
  getTodoListItems(listId: string): Promise<TodoListItem[]>
  saveTodoListItem(item: TodoListItem): Promise<TodoListItem>
  deleteTodoListItem(id: string): Promise<void>
  reorderTodoListItems(listId: string, orderedIds: string[]): Promise<void>

  // Utility
  clearAll?(): Promise<void>
}
