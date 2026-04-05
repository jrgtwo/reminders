import { ipcMain } from 'electron'
import * as repo from '../storage/todo_lists.repo'
import * as itemRepo from '../storage/todo_list_items.repo'
import type { TodoList, TodoListItem } from '../../renderer/src/types/models'

export function registerTodoListHandlers() {
  ipcMain.handle('todo_lists:getAll', () => repo.getAllLists())
  ipcMain.handle('todo_lists:save', (_e, l: TodoList) => repo.saveList(l))
  ipcMain.handle('todo_lists:delete', (_e, id: string) => repo.deleteList(id))

  ipcMain.handle('todo_lists:getAllItemsForList', (_e, listId: string) =>
    itemRepo.getAllItemsForList(listId)
  )
  ipcMain.handle('todo_lists:saveItem', (_e, item: TodoListItem) => itemRepo.saveItem(item))
  ipcMain.handle('todo_lists:deleteItem', (_e, id: string) => itemRepo.deleteItem(id))
  ipcMain.handle('todo_lists:reorderItems', (_e, listId: string, orderedIds: string[]) =>
    itemRepo.reorderItems(listId, orderedIds)
  )
}
