import { ipcMain } from 'electron'
import * as repo from '../storage/todo_lists.repo'
import type { TodoList } from '../../renderer/src/types/models'

export function registerTodoListHandlers() {
  ipcMain.handle('todo_lists:getAll', () => repo.getAllLists())
  ipcMain.handle('todo_lists:save', (_e, l: TodoList) => repo.saveList(l))
  ipcMain.handle('todo_lists:delete', (_e, id: string) => repo.deleteList(id))
}
