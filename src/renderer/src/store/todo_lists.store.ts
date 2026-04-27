import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import type { TodoList, TodoListItem } from '../types/models'

enableMapSet()

interface TodoListsState {
  lists: TodoList[]
  items: Map<string, TodoListItem[]>
  load: () => Promise<void>
  save: (l: TodoList) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
  loadItems: (listId: string) => Promise<void>
  saveItem: (item: TodoListItem) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  reorderItems: (listId: string, orderedIds: string[]) => Promise<void>
}

export const useTodoListsStore = create<TodoListsState>()(
  immer((set, get) => ({
    lists: [],
    items: new Map(),

    load: async () => {
      const { getStorage } = await import('../platform')
      try {
        const lists = await getStorage().getTodoLists()
        console.log('[todo_lists.store] Loaded lists:', lists)
        set((s) => {
          s.lists = lists
        })
      } catch (err) {
        console.error('[todo_lists] Failed to load lists:', err)
        throw err
      }
    },

    save: async (l) => {
      const { useAuthStore } = await import('./auth.store')
      if (!useAuthStore.getState().requireAuthOrPromptSignIn()) return
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
      set((s) => {
        s.lists = s.lists.filter((l) => l.id !== id)
        s.items.delete(id)
      })
      if (!(window as any).electronAPI) {
        const { useAuthStore } = await import('./auth.store')
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const { webSoftDelete } = await import('../lib/webSync')
          webSoftDelete('todo_lists', id, userId).catch(console.error)
        }
      }
    },

    reorder: async (orderedIds) => {
      const sorted = orderedIds
        .map((id, i) => {
          const l = get().lists.find((x) => x.id === id)
          return l ? { ...l, order: (i + 1) * 1000 } : null
        })
        .filter(Boolean) as TodoList[]
      set((s) => {
        s.lists = sorted
      })
      const { getStorage } = await import('../platform')
      await Promise.all(sorted.map((l) => getStorage().saveTodoList(l)))
    },

    loadItems: async (listId) => {
      const { getStorage } = await import('../platform')
      const items = await getStorage().getTodoListItems(listId)
      set((s) => {
        s.items.set(listId, items)
      })
    },

    saveItem: async (item) => {
      const { useAuthStore } = await import('./auth.store')
      if (!useAuthStore.getState().requireAuthOrPromptSignIn()) return
      const { getStorage } = await import('../platform')
      try {
        const saved = await getStorage().saveTodoListItem(item)
        set((s) => {
          const listItems = s.items.get(item.listId) ?? []
          const idx = listItems.findIndex((x) => x.id === saved.id)
          if (idx >= 0) listItems[idx] = saved
          else listItems.push(saved)
          s.items.set(item.listId, [...listItems])
        })
      } catch (err) {
        console.error('[todo_lists] Failed to save item:', err)
        throw err
      }
    },

    deleteItem: async (id) => {
      // Find which list this item belongs to
      const listId = Array.from(get().items.entries()).find(([, items]) =>
        items.some((i) => i.id === id)
      )?.[0]
      if (!listId) return
      const { getStorage } = await import('../platform')
      await getStorage().deleteTodoListItem(id)
      set((s) => {
        const listItems = s.items.get(listId) ?? []
        s.items.set(
          listId,
          listItems.filter((i) => i.id !== id)
        )
      })
    },

    reorderItems: async (listId, orderedIds) => {
      set((s) => {
        const listItems = s.items.get(listId) ?? []
        const sorted = orderedIds
          .map((id, i) => {
            const item = listItems.find((x) => x.id === id)
            return item ? { ...item, order: (i + 1) * 1000 } : null
          })
          .filter(Boolean) as TodoListItem[]
        s.items.set(listId, sorted)
      })
      const { getStorage } = await import('../platform')
      await getStorage().reorderTodoListItems(listId, orderedIds)
    }
  }))
)
