 import { ipcMain } from 'electron'
 import * as repo from '../storage/todos.repo'
 import type { Todo } from '../../renderer/src/types/models'

 export function registerTodoHandlers() {
   ipcMain.handle('todos:getAll', () => repo.getAllTodos())
   ipcMain.handle('todos:save', (_e, t: Todo) => repo.saveTodo(t))
   ipcMain.handle('todos:delete', (_e, id: string) => repo.deleteTodo(id))
   ipcMain.handle('todos:reorder', (_e, ids: string[]) => repo.reorderTodos(ids))
 }