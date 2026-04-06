import { ipcMain } from 'electron'
import * as repo from '../storage/notes.repo'
import type { Note, NoteFolder } from '../../renderer/src/types/models'
import { generateTitle } from '../utils'

export function registerNoteHandlers() {
  // Notes
  ipcMain.handle('notes:getAll', () => repo.getAllNotes())
  ipcMain.handle('notes:getById', (_e, id: string) => repo.getNoteById(id))
  ipcMain.handle('notes:save', (_e, n: Note) => {
    if (!n.title) {
      n.title = generateTitle()
    }
    n.updatedAt = new Date().toISOString()
    return repo.saveNote(n)
  })
  ipcMain.handle('notes:delete', (_e, id: string) => repo.deleteNote(id))
  ipcMain.handle('notes:getByFolder', (_e, folderId: string) => repo.getNotesByFolder(folderId))
  ipcMain.handle('notes:getByDate', (_e, date: string) => repo.getNotesByDate(date))

  // Note Folders
  ipcMain.handle('noteFolders:getAll', () => repo.getAllNoteFolders())
  ipcMain.handle('noteFolders:save', (_e, f: NoteFolder) => repo.saveNoteFolder(f))
  ipcMain.handle('noteFolders:delete', (_e, id: string) => repo.deleteNoteFolder(id))
}
