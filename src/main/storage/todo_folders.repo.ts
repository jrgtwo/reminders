import { getDb } from './db'
import type { TodoFolder } from '../../renderer/src/types/models'

export function getAllFolders(): TodoFolder[] {
  const rows = getDb()
    .prepare('SELECT * FROM todo_folders WHERE deleted_at IS NULL ORDER BY sort_order')
    .all() as any[]
  return rows.map(deserialize)
}

export function saveFolder(f: TodoFolder): TodoFolder {
  getDb()
    .prepare(
      `INSERT INTO todo_folders (id, name, sort_order, created_at, updated_at)
        VALUES (@id, @name, @sort_order, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          name = @name, sort_order = @sort_order, updated_at = @updated_at`
    )
    .run(serialize(f))
  return f
}

export function deleteFolder(id: string): void {
  const date = new Date().toISOString()
  getDb().prepare('UPDATE todo_folders SET deleted_at = ?, updated_at = ? WHERE id = ?').run(date, date, id)
}

function serialize(f: TodoFolder) {
  return {
    id: f.id,
    name: f.name,
    sort_order: f.order,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  }
}

function deserialize(row: any): TodoFolder {
  return {
    id: row.id,
    name: row.name,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
