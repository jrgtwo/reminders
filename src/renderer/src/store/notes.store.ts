import { create } from 'zustand'
 import { immer } from 'zustand/middleware/immer'
 import type { Note } from '../types/models'

 interface NotesState {
   notes: Record<string, Note>
   loadNote: (date: string) => Promise<void>
   saveNote: (n: Note) => Promise<void>
 }

 export const useNotesStore = create<NotesState>()(
   immer((set) => ({
     notes: {},

     loadNote: async (date) => {
       const { getStorage } = await import('../platform')
       const note = await getStorage().getNoteByDate(date)
       if (note) {
         set((s) => { s.notes[date] = note })
       }
     },

     saveNote: async (n) => {
       const { getStorage } = await import('../platform')
       const saved = await getStorage().saveNote(n)
       set((s) => { s.notes[saved.date] = saved })
     },
   }))
 )