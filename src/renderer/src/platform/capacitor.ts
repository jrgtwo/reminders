import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import type { IStorageAdapter } from './types'
import type {
  Reminder,
  Note,
  NoteFolder,
  TodoFolder,
  TodoList,
  TodoListItem
} from '../types/models'

const DB_NAME = 'reminders'

// Full schema at current version — applied once on fresh install via CREATE IF NOT EXISTS.
// Mirrors all migrations in src/main/storage/db.ts.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    end_date TEXT,
    start_time TEXT,
    end_time TEXT,
    recurrence TEXT,
    completed_dates TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date);

  CREATE TABLE IF NOT EXISTS note_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order REAL NOT NULL DEFAULT 0,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    folder_id TEXT,
    due_date TEXT,
    display_order REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, display_order);
  CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(due_date, display_order);

  CREATE TABLE IF NOT EXISTS todo_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order REAL NOT NULL DEFAULT 0,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS todo_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    folder_id TEXT,
    due_date TEXT,
    sort_order REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS todo_list_items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order REAL NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_todo_list_items_list ON todo_list_items(list_id, sort_order);

  CREATE TABLE IF NOT EXISTS sync_meta (
    user_id TEXT PRIMARY KEY,
    last_pull_at TEXT
  );

  INSERT OR IGNORE INTO schema_version VALUES (9);
`

export class CapacitorAdapter implements IStorageAdapter {
  private db!: SQLiteDBConnection
  private sqlite = new SQLiteConnection(CapacitorSQLite)

  async init(): Promise<void> {
    const consistency = await this.sqlite.checkConnectionsConsistency()
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result
    if (consistency.result && isConn) {
      this.db = await this.sqlite.retrieveConnection(DB_NAME, false)
    } else {
      this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
    }
    await this.db.open()
    await this.db.execute(SCHEMA)
  }

  // --- Reminders ---

  async getReminders(): Promise<Reminder[]> {
    const res = await this.db.query('SELECT * FROM reminders WHERE deleted_at IS NULL')
    return (res.values ?? []).map(deserializeReminder)
  }

  async getRemindersByDate(date: string): Promise<Reminder[]> {
    const res = await this.db.query(
      'SELECT * FROM reminders WHERE deleted_at IS NULL AND date = ?',
      [date]
    )
    return (res.values ?? []).map(deserializeReminder)
  }

  async saveReminder(r: Reminder): Promise<Reminder> {
    await this.db.run(
      `INSERT INTO reminders
         (id, title, description, date, end_date, start_time, end_time, recurrence, completed_dates, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, description = excluded.description, date = excluded.date,
         end_date = excluded.end_date, start_time = excluded.start_time, end_time = excluded.end_time,
         recurrence = excluded.recurrence, completed_dates = excluded.completed_dates,
         updated_at = excluded.updated_at`,
      [
        r.id,
        r.title,
        r.description ?? null,
        r.date,
        r.endDate ?? null,
        r.startTime ?? null,
        r.endTime ?? null,
        r.recurrence ? JSON.stringify(r.recurrence) : null,
        JSON.stringify(r.completedDates),
        r.createdAt,
        r.updatedAt
      ]
    )
    return r
  }

  async deleteReminder(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.run('UPDATE reminders SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      now,
      now,
      id
    ])
  }

  // --- Notes ---

  async getAllNotes(): Promise<Note[]> {
    const res = await this.db.query('SELECT * FROM notes WHERE deleted_at IS NULL')
    return (res.values ?? []).map(deserializeNote)
  }

  async getNoteById(id: string): Promise<Note | null> {
    const res = await this.db.query(
      'SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL',
      [id]
    )
    const row = res.values?.[0]
    return row ? deserializeNote(row) : null
  }

  async saveNote(n: Note): Promise<Note> {
    await this.db.run(
      `INSERT INTO notes
         (id, title, content, folder_id, due_date, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, content = excluded.content, folder_id = excluded.folder_id,
         due_date = excluded.due_date, display_order = excluded.display_order,
         updated_at = excluded.updated_at`,
      [
        n.id,
        n.title ?? null,
        n.content,
        n.folderId ?? null,
        n.date ?? null,
        n.displayOrder,
        n.createdAt,
        n.updatedAt
      ]
    )
    return n
  }

  async deleteNote(id: string): Promise<void> {
    await this.db.run('UPDATE notes SET deleted_at = ? WHERE id = ?', [
      new Date().toISOString(),
      id
    ])
  }

  async getNotesByFolder(folderId: string): Promise<Note[]> {
    const res = await this.db.query(
      'SELECT * FROM notes WHERE deleted_at IS NULL AND folder_id = ? ORDER BY display_order ASC',
      [folderId]
    )
    return (res.values ?? []).map(deserializeNote)
  }

  async getNotesByDate(date: string): Promise<Note[]> {
    const res = await this.db.query(
      'SELECT * FROM notes WHERE deleted_at IS NULL AND due_date = ? ORDER BY display_order ASC',
      [date]
    )
    return (res.values ?? []).map(deserializeNote)
  }

  // --- Note Folders ---

  async getAllNoteFolders(): Promise<NoteFolder[]> {
    const res = await this.db.query(
      'SELECT * FROM note_folders WHERE deleted_at IS NULL ORDER BY display_order ASC'
    )
    return (res.values ?? []).map(deserializeNoteFolder)
  }

  async saveNoteFolder(f: NoteFolder): Promise<NoteFolder> {
    await this.db.run(
      `INSERT INTO note_folders (id, name, display_order, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, display_order = excluded.display_order,
         parent_id = excluded.parent_id, updated_at = excluded.updated_at`,
      [f.id, f.name, f.displayOrder, f.parentId ?? null, f.createdAt, f.updatedAt]
    )
    return f
  }

  async deleteNoteFolder(id: string): Promise<void> {
    await this.db.run('UPDATE note_folders SET deleted_at = ? WHERE id = ?', [
      new Date().toISOString(),
      id
    ])
  }

  // --- Todo Folders ---

  async getTodoFolders(): Promise<TodoFolder[]> {
    const res = await this.db.query(
      'SELECT * FROM todo_folders WHERE deleted_at IS NULL ORDER BY sort_order ASC'
    )
    return (res.values ?? []).map(deserializeTodoFolder)
  }

  async saveTodoFolder(f: TodoFolder): Promise<TodoFolder> {
    await this.db.run(
      `INSERT INTO todo_folders (id, name, sort_order, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, sort_order = excluded.sort_order,
         parent_id = excluded.parent_id, updated_at = excluded.updated_at`,
      [f.id, f.name, f.order, f.parentId ?? null, f.createdAt, f.updatedAt]
    )
    return f
  }

  async deleteTodoFolder(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.run(
      'UPDATE todo_folders SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    )
  }

  // --- Todo Lists ---

  async getTodoLists(): Promise<TodoList[]> {
    const res = await this.db.query(
      'SELECT * FROM todo_lists WHERE deleted_at IS NULL ORDER BY sort_order ASC'
    )
    return (res.values ?? []).map(deserializeTodoList)
  }

  async saveTodoList(l: TodoList): Promise<TodoList> {
    await this.db.run(
      `INSERT INTO todo_lists (id, name, folder_id, due_date, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, folder_id = excluded.folder_id, due_date = excluded.due_date,
         sort_order = excluded.sort_order, updated_at = excluded.updated_at`,
      [l.id, l.name, l.folderId ?? null, l.dueDate ?? null, l.order, l.createdAt, l.updatedAt]
    )
    return l
  }

  async deleteTodoList(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.run(
      'UPDATE todo_lists SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    )
  }

  // --- Todo List Items ---

  async getTodoListItems(listId: string): Promise<TodoListItem[]> {
    const res = await this.db.query(
      'SELECT * FROM todo_list_items WHERE list_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC',
      [listId]
    )
    return (res.values ?? []).map(deserializeTodoListItem)
  }

  async saveTodoListItem(item: TodoListItem): Promise<TodoListItem> {
    await this.db.run(
      `INSERT INTO todo_list_items
         (id, list_id, title, description, sort_order, completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, description = excluded.description, sort_order = excluded.sort_order,
         completed = excluded.completed, completed_at = excluded.completed_at,
         updated_at = excluded.updated_at`,
      [
        item.id,
        item.listId,
        item.title,
        item.description ?? null,
        item.order,
        item.completed ? 1 : 0,
        item.completedAt ?? null,
        item.createdAt,
        item.updatedAt
      ]
    )
    return item
  }

  async deleteTodoListItem(id: string): Promise<void> {
    await this.db.run('DELETE FROM todo_list_items WHERE id = ?', [id])
  }

  async reorderTodoListItems(listId: string, orderedIds: string[]): Promise<void> {
    const now = new Date().toISOString()
    const set = orderedIds.map((id, i) => ({
      statement:
        'UPDATE todo_list_items SET sort_order = ?, updated_at = ? WHERE id = ? AND list_id = ?',
      values: [(i + 1) * 1000, now, id, listId]
    }))
    await this.db.executeSet(set)
  }
}

// --- Deserializers ---

function deserializeReminder(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    endDate: row.end_date ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
    completedDates: JSON.parse(row.completed_dates ?? '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function deserializeNote(row: any): Note {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content,
    folderId: row.folder_id ?? undefined,
    date: row.due_date ?? undefined,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function deserializeNoteFolder(row: any): NoteFolder {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function deserializeTodoFolder(row: any): TodoFolder {
  return {
    id: row.id,
    name: row.name,
    order: row.sort_order,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function deserializeTodoList(row: any): TodoList {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function deserializeTodoListItem(row: any): TodoListItem {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description ?? undefined,
    order: row.sort_order,
    completed: row.completed === 1,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
