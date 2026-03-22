 import { ipcMain } from 'electron'
 import * as repo from '../storage/notes.repo'
 import type { Note } from '../../renderer/src/types/models'

 export function registerNoteHandlers() {
   ipcMain.handle('notes:getAll', () => repo.getAllNotes())
   ipcMain.handle('notes:getByDate', (_e, date: string) => repo.getNoteByDate(date))
   ipcMain.handle('notes:save', (_e, n: Note) => repo.saveNote(n))
 }
