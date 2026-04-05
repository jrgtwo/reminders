import { useMemo } from 'react'
import { useRemindersStore } from '../store/reminders.store'
import { useTodoListsStore } from '../store/todo_lists.store'
import { useNotesStore } from '../store/notes.store'
import type { Reminder, TodoListItem, Note } from '../types/models'

export interface SearchResults {
  reminders: Reminder[]
  items: TodoListItem[]
  notes: Note[]
}

export function useSearch(query: string): SearchResults {
  const reminders = useRemindersStore((s) => s.reminders)
  const storeItems = useTodoListsStore((s) => s.items)
  const notes = useNotesStore((s) => s.notes)

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { reminders: [], items: [], notes: [] }

    const allItems: TodoListItem[] = Array.from(storeItems.values()).flat()

    return {
      reminders: reminders
        .filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
        .slice(0, 5),
      items: allItems
        .filter((i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
        .slice(0, 5),
      notes: Object.values(notes)
        .filter((n) => n.content.toLowerCase().includes(q))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    }
  }, [query, reminders, storeItems, notes])
}
