import { getDb } from './db'
import type { Todo } from '../../renderer/src/types/models'

export function getAllTodos(): Todo[] {
  const rows = getDb()
    .prepare('SELECT * FROM todos WHERE deleted_at IS NULL ORDER BY sort_order')
    .all() as any[]
  return rows.map(deserialize)
}

export function saveTodo(t: Todo): Todo {
  getDb()
    .prepare(
      `INSERT INTO todos (id, title, description, sort_order, completed,
 completed_at, created_at, updated_at)
        VALUES (@id, @title, @description, @sort_order, @completed, @completed_at,
 @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          title = @title, description = @description, sort_order = @sort_order,
          completed = @completed, completed_at = @completed_at, updated_at =
 @updated_at`
    )
    .run(serialize(t))
  return t
}

export function deleteTodo(id: string): void {
  const date = new Date().toISOString()
  getDb().prepare('UPDATE todos SET deleted_at =?, updated_at = ? WHERE id = ?').run(date, date, id)
}

export function reorderTodos(orderedIds: string[]): void {
  const stmt = getDb().prepare('UPDATE todos SET sort_order = ? WHERE id = ?')
  const tx = getDb().transaction((ids: string[]) => {
    ids.forEach((id, i) => stmt.run((i + 1) * 1000, id))
  })
  tx(orderedIds)
}

function serialize(t: Todo) {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    sort_order: t.order,
    completed: t.completed ? 1 : 0,
    completed_at: t.completedAt ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt
  }
}

function deserialize(row: any): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    order: row.sort_order,
    completed: row.completed === 1,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
