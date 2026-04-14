import { ipcMain } from 'electron'
import * as repo from '../storage/todo_folders.repo'
import { TodoFolderSchema, Id } from './schemas'

export function registerTodoFolderHandlers() {
  ipcMain.handle('todo_folders:getAll', () => repo.getAllFolders())
  ipcMain.handle('todo_folders:save', (_e, f: unknown) => {
    const folder = TodoFolderSchema.parse(f)
    return repo.saveFolder(folder)
  })
  ipcMain.handle('todo_folders:delete', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.deleteFolder(validId)
  })
}
