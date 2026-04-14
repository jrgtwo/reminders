import { ipcMain } from 'electron'
import * as repo from '../storage/notes.repo'
import { NoteSchema, NoteFolderSchema, Id, DateStr } from './schemas'
import { generateTitle } from '../utils'

export function registerNoteHandlers() {
  // Notes
  ipcMain.handle('notes:getAll', () => repo.getAllNotes())
  ipcMain.handle('notes:getById', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.getNoteById(validId)
  })
  ipcMain.handle('notes:save', (_e, n: unknown) => {
    const note = NoteSchema.parse(n)
    if (!note.title) {
      note.title = generateTitle()
    }
    note.updatedAt = new Date().toISOString()
    return repo.saveNote(note)
  })
  ipcMain.handle('notes:delete', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.deleteNote(validId)
  })
  ipcMain.handle('notes:getByFolder', (_e, folderId: unknown) => {
    const validId = Id.parse(folderId)
    return repo.getNotesByFolder(validId)
  })
  ipcMain.handle('notes:getByDate', (_e, date: unknown) => {
    const d = DateStr.parse(date)
    return repo.getNotesByDate(d)
  })

  // Note Folders
  ipcMain.handle('noteFolders:getAll', () => repo.getAllNoteFolders())
  ipcMain.handle('noteFolders:save', (_e, f: unknown) => {
    const folder = NoteFolderSchema.parse(f)
    return repo.saveNoteFolder(folder)
  })
  ipcMain.handle('noteFolders:delete', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.deleteNoteFolder(validId)
  })
}
