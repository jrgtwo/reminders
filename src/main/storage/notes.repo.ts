import { getDb } from './db'
import type { Note, NoteFolder } from '../../renderer/src/types/models'

export function getAllNotes(): Note[] {
  const rows = getDb().prepare('SELECT * FROM notes WHERE deleted_at IS NULL').all() as any[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id,
    date: row.due_date,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export function getNotesByFolder(folderId: string): Note[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM notes WHERE deleted_at IS NULL AND folder_id = ? ORDER BY display_order ASC'
    )
    .all(folderId) as any[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id,
    date: row.due_date,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export function getNotesByDate(date: string): Note[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM notes WHERE deleted_at IS NULL AND due_date = ? ORDER BY display_order ASC'
    )
    .all(date) as any[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id,
    date: row.due_date,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export function getNoteById(id: string): Note | null {
  const row = getDb()
    .prepare('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL')
    .get(id) as any
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    folderId: row.folder_id,
    date: row.due_date,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function saveNote(n: Note): Note {
  getDb()
    .prepare(
      `INSERT INTO notes (id, title, content, folder_id, due_date, display_order, created_at, updated_at)
       VALUES (@id, @title, @content, @folder_id, @due_date, @display_order, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         title = @title,
         content = @content,
         folder_id = @folder_id,
         due_date = @due_date,
         display_order = @display_order,
         updated_at = @updated_at`
    )
    .run({
      id: n.id,
      title: n.title ?? null,
      content: n.content,
      folder_id: n.folderId ?? null,
      due_date: n.date ?? null,
      display_order: n.displayOrder,
      created_at: n.createdAt,
      updated_at: n.updatedAt
    })
  return n
}

export function deleteNote(id: string): void {
  getDb().prepare('UPDATE notes SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id)
}

export function getAllNoteFolders(): NoteFolder[] {
  const rows = getDb()
    .prepare('SELECT * FROM note_folders WHERE deleted_at IS NULL ORDER BY display_order ASC')
    .all() as any[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export function saveNoteFolder(f: NoteFolder): NoteFolder {
  getDb()
    .prepare(
      `INSERT INTO note_folders (id, name, display_order, created_at, updated_at)
       VALUES (@id, @name, @display_order, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = @name,
         display_order = @display_order,
         updated_at = @updated_at`
    )
    .run({
      id: f.id,
      name: f.name,
      display_order: f.displayOrder,
      created_at: f.createdAt,
      updated_at: f.updatedAt
    })
  return f
}

export function deleteNoteFolder(id: string): void {
  getDb()
    .prepare('UPDATE note_folders SET deleted_at = ? WHERE id = ?')
    .run(new Date().toISOString(), id)
}
