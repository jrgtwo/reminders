import { getDb } from './db'
import type { TodoList } from '../../renderer/src/types/models'

export function getAllLists(): TodoList[] {
  const rows = getDb()
    .prepare('SELECT * FROM todo_lists WHERE deleted_at IS NULL ORDER BY sort_order')
    .all() as any[]
  return rows.map(deserialize)
}

export function saveList(l: TodoList): TodoList {
  getDb()
    .prepare(
      `INSERT INTO todo_lists (id, name, folder_id, due_date, sort_order, created_at, updated_at)
       VALUES (@id, @name, @folder_id, @due_date, @sort_order, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = @name, folder_id = @folder_id, due_date = @due_date,
         sort_order = @sort_order, updated_at = @updated_at`
    )
    .run(serialize(l))
  return l
}

export function deleteList(id: string): void {
  const date = new Date().toISOString()
  getDb()
    .prepare('UPDATE todo_lists SET deleted_at = ?, updated_at = ? WHERE id = ?')
    .run(date, date, id)
}

function serialize(l: TodoList) {
  return {
    id: l.id,
    name: l.name,
    folder_id: l.folderId ?? null,
    due_date: l.dueDate ?? null,
    sort_order: l.order,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  }
}

function deserialize(row: any): TodoList {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
