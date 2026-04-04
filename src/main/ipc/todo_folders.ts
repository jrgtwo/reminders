import { ipcMain } from 'electron'
import * as repo from '../storage/todo_folders.repo'
import type { TodoFolder } from '../../renderer/src/types/models'

export function registerTodoFolderHandlers() {
  ipcMain.handle('todo_folders:getAll', () => repo.getAllFolders())
  ipcMain.handle('todo_folders:save', (_e, f: TodoFolder) => repo.saveFolder(f))
  ipcMain.handle('todo_folders:delete', (_e, id: string) => repo.deleteFolder(id))
}
