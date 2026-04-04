import { create } from 'zustand'
 import { immer } from 'zustand/middleware/immer'
 import type { Note } from '../types/models'
 import { capture } from '../lib/analytics'

 interface NotesState {
   notes: Record<string, Note>
   noteDates: string[]
   loadNote: (date: string) => Promise<void>
   loadNoteDates: () => Promise<void>
   loadAllNotes: () => Promise<void>
   saveNote: (n: Note) => Promise<void>
 }

 export const useNotesStore = create<NotesState>()(
   immer((set) => ({
     notes: {},
     noteDates: [],

     loadNoteDates: async () => {
       const { getStorage } = await import('../platform')
       const all = await getStorage().getAllNotes()
       set((s) => { s.noteDates = all.map((n) => n.date) })
     },

     loadAllNotes: async () => {
       const { getStorage } = await import('../platform')
       const all = await getStorage().getAllNotes()
       set((s) => {
         for (const n of all) s.notes[n.date] = n
         s.noteDates = all.map((n) => n.date)
       })
     },

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
       set((s) => {
         s.notes[saved.date] = saved
         if (!s.noteDates.includes(saved.date)) s.noteDates.push(saved.date)
       })
       capture('note_saved', { date: saved.date, content_length: saved.content.length })
     },
   }))
 )