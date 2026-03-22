import { useMemo } from 'react'
import { useRemindersStore } from '../store/reminders.store'
import { useTodosStore } from '../store/todos.store'
import type { Reminder, Todo } from '../types/models'

export interface SearchResults {
  reminders: Reminder[]
  todos: Todo[]
}

export function useSearch(query: string): SearchResults {
  const reminders = useRemindersStore((s) => s.reminders)
  const todos = useTodosStore((s) => s.todos)

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { reminders: [], todos: [] }
    return {
      reminders: reminders
        .filter(
          (r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
        )
        .slice(0, 5),
      todos: todos
        .filter(
          (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
        )
        .slice(0, 5),
    }
  }, [query, reminders, todos])
}
