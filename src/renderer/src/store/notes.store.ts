import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Note } from '../types/models'
import { capture } from '../lib/analytics'

interface NotesState {
  notes: Map<string, Note>
  folderId: string | null
  date: string | null
  loadNotes: () => Promise<void>
  loadNotesByFolder: (folderId: string) => Promise<void>
  loadNotesByDate: (date: string) => Promise<void>
  saveNote: (n: Note) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  clearNotes: () => void
}

export const useNotesStore = create<NotesState>()(
  immer((set) => ({
    notes: new Map(),
    folderId: null,
    date: null,

    loadNotes: async () => {
      const { getStorage } = await import('../platform')
      const all = await getStorage().getAllNotes()
      set((s) => {
        s.notes = new Map(all.map((n) => [n.id, n]))
        s.folderId = null
        s.date = null
      })
    },

    loadNotesByFolder: async (folderId) => {
      const { getStorage } = await import('../platform')
      const notes = await getStorage().getNotesByFolder(folderId)
      set((s) => {
        s.notes = new Map(notes.map((n) => [n.id, n]))
        s.folderId = folderId
        s.date = null
      })
    },

    loadNotesByDate: async (date) => {
      const { getStorage } = await import('../platform')
      const notes = await getStorage().getNotesByDate(date)
      set((s) => {
        s.notes = new Map(notes.map((n) => [n.id, n]))
        s.folderId = null
        s.date = date
      })
    },

    saveNote: async (n) => {
      const { getStorage } = await import('../platform')
      const saved = await getStorage().saveNote(n)
      set((s) => {
        s.notes.set(saved.id, saved)
      })
      capture('note_saved', { content_length: saved.content.length })
      const { useSyncStore } = await import('./sync.store')
      useSyncStore.getState().trigger()
    },

    deleteNote: async (id) => {
      const { getStorage } = await import('../platform')
      await getStorage().deleteNote(id)
      set((s) => {
        s.notes.delete(id)
      })
      const { useSyncStore } = await import('./sync.store')
      useSyncStore.getState().trigger()
      if (!(window as any).electronAPI) {
        const { useAuthStore } = await import('./auth.store')
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const { webSoftDelete } = await import('../lib/webSync')
          webSoftDelete('notes', id, userId).catch(console.error)
        }
      }
    },

    clearNotes: () => {
      set((s) => {
        s.notes = new Map()
        s.folderId = null
        s.date = null
      })
    }
  }))
)
