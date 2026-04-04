import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TodoList } from '../types/models'

interface TodoListsState {
  lists: TodoList[]
  load: () => Promise<void>
  save: (l: TodoList) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
}

export const useTodoListsStore = create<TodoListsState>()(
  immer((set, get) => ({
    lists: [],

    load: async () => {
      const { getStorage } = await import('../platform')
      const lists = await getStorage().getTodoLists()
      set((s) => { s.lists = lists })
    },

    save: async (l) => {
      const { getStorage } = await import('../platform')
      const saved = await getStorage().saveTodoList(l)
      set((s) => {
        const idx = s.lists.findIndex((x) => x.id === saved.id)
        if (idx >= 0) s.lists[idx] = saved
        else s.lists.push(saved)
      })
    },

    remove: async (id) => {
      const { getStorage } = await import('../platform')
      await getStorage().deleteTodoList(id)
      set((s) => { s.lists = s.lists.filter((l) => l.id !== id) })
    },

    reorder: async (orderedIds) => {
      const sorted = orderedIds
        .map((id, i) => {
          const l = get().lists.find((x) => x.id === id)
          return l ? { ...l, order: (i + 1) * 1000 } : null
        })
        .filter(Boolean) as TodoList[]
      set((s) => { s.lists = sorted })
      // persist each via saveTodoList (no dedicated reorder endpoint needed)
      const { getStorage } = await import('../platform')
      await Promise.all(sorted.map((l) => getStorage().saveTodoList(l)))
    },
  }))
)
