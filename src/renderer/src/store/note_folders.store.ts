import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { NoteFolder } from '../types/models'

interface NoteFoldersState {
  folders: NoteFolder[]
  load: () => Promise<void>
  save: (f: NoteFolder) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNoteFoldersStore = create<NoteFoldersState>()(
  immer((set) => ({
    folders: [],

    load: async () => {
      const { getStorage } = await import('../platform')
      const folders = await getStorage().getAllNoteFolders()
      set((s) => { s.folders = folders })
    },

    save: async (f) => {
      const { getStorage } = await import('../platform')
      const saved = await getStorage().saveNoteFolder(f)
      set((s) => {
        const idx = s.folders.findIndex((x) => x.id === saved.id)
        if (idx >= 0) s.folders[idx] = saved
        else s.folders.push(saved)
      })
    },

    remove: async (id) => {
      const { getStorage } = await import('../platform')
      await getStorage().deleteNoteFolder(id)
      set((s) => { s.folders = s.folders.filter((f) => f.id !== id) })
      if (!(window as any).electronAPI) {
        const { useAuthStore } = await import('./auth.store')
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const { webSoftDelete } = await import('../lib/webSync')
          webSoftDelete('note_folders', id, userId).catch(console.error)
        }
      }
    },
  }))
)
