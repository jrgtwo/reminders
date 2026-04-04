import { useMemo } from 'react'
import { useRemindersStore } from '../store/reminders.store'
import { useTodosStore } from '../store/todos.store'
import { useNotesStore } from '../store/notes.store'
import type { Reminder, Todo, Note } from '../types/models'

export interface SearchResults {
  reminders: Reminder[]
  todos: Todo[]
  notes: Note[]
}

export function useSearch(query: string): SearchResults {
  const reminders = useRemindersStore((s) => s.reminders)
  const todos = useTodosStore((s) => s.todos)
  const notes = useNotesStore((s) => s.notes)

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { reminders: [], todos: [], notes: [] }
    return {
      reminders: reminders
        .filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
        .slice(0, 5),
      todos: todos
        .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
        .slice(0, 5),
      notes: Object.values(notes)
        .filter((n) => n.content.toLowerCase().includes(q))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    }
  }, [query, reminders, todos, notes])
}
