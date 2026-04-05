import { getDb } from './db'
import type { TodoListItem } from '../../renderer/src/types/models'

export function getAllItemsForList(listId: string): TodoListItem[] {
  const rows = getDb()
    .prepare('SELECT * FROM todo_list_items WHERE list_id = ? AND deleted_at IS NULL ORDER BY sort_order')
    .all(listId) as any[]
  return rows.map(deserialize)
}

export function saveItem(item: TodoListItem): TodoListItem {
  getDb()
    .prepare(
      `INSERT INTO todo_list_items (id, list_id, title, description, sort_order, completed, completed_at, created_at, updated_at)
       VALUES (@id, @list_id, @title, @description, @sort_order, @completed, @completed_at, @created_at, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         title = @title, description = @description, sort_order = @sort_order,
         completed = @completed, completed_at = @completed_at, updated_at = @updated_at`
    )
    .run(serialize(item))
  return item
}

export function deleteItem(id: string): void {
  getDb().prepare('DELETE FROM todo_list_items WHERE id = ?').run(id)
}

export function reorderItems(listId: string, orderedIds: string[]): void {
  const stmt = getDb().prepare('UPDATE todo_list_items SET sort_order = ? WHERE id = ?')
  getDb().transaction((ids: string[]) => {
    ids.forEach((id, i) => stmt.run((i + 1) * 1000, id))
  })(orderedIds)
}

function serialize(item: TodoListItem) {
  return {
    id: item.id,
    list_id: item.listId,
    title: item.title,
    description: item.description ?? null,
    sort_order: item.order,
    completed: item.completed ? 1 : 0,
    completed_at: item.completedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

function deserialize(row: any): TodoListItem {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description ?? undefined,
    order: row.sort_order,
    completed: row.completed === 1,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
