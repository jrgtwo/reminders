import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TodoFolder } from '../types/models'

interface TodoFoldersState {
  folders: TodoFolder[]
  load: () => Promise<void>
  save: (f: TodoFolder) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTodoFoldersStore = create<TodoFoldersState>()(
  immer((set) => ({
    folders: [],

    load: async () => {
      const { getStorage } = await import('../platform')
      const folders = await getStorage().getTodoFolders()
      set((s) => { s.folders = folders })
    },

    save: async (f) => {
      const { useAuthStore } = await import('./auth.store')
      if (!useAuthStore.getState().requireAuthOrPromptSignIn()) return
      const { getStorage } = await import('../platform')
      const saved = await getStorage().saveTodoFolder(f)
      set((s) => {
        const idx = s.folders.findIndex((x) => x.id === saved.id)
        if (idx >= 0) s.folders[idx] = saved
        else s.folders.push(saved)
      })
    },

    remove: async (id) => {
      const { getStorage } = await import('../platform')
      await getStorage().deleteTodoFolder(id)
      set((s) => { s.folders = s.folders.filter((f) => f.id !== id) })
      if (!(window as any).electronAPI) {
        const { useAuthStore } = await import('./auth.store')
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const { webSoftDelete } = await import('../lib/webSync')
          webSoftDelete('todo_folders', id, userId).catch(console.error)
        }
      }
    },
  }))
)
