import { ipcMain } from 'electron'
import * as repo from '../storage/todo_lists.repo'
import * as itemRepo from '../storage/todo_list_items.repo'
import type { TodoList, TodoListItem } from '../../renderer/src/types/models'

export function registerTodoListHandlers() {
  ipcMain.handle('todo_lists:getAll', () => {
    console.log('[main] todo_lists:getAll')
    return repo.getAllLists()
  })
  ipcMain.handle('todo_lists:save', (_e, l: TodoList) => {
    console.log('[main] todo_lists:save', l)
    return repo.saveList(l)
  })
  ipcMain.handle('todo_lists:delete', (_e, id: string) => {
    console.log('[main] todo_lists:delete', id)
    return repo.deleteList(id)
  })

  ipcMain.handle('todo_lists:getAllItemsForList', (_e, listId: string) => {
    console.log('[main] todo_lists:getAllItemsForList', listId)
    return itemRepo.getAllItemsForList(listId)
  })
  ipcMain.handle('todo_lists:saveItem', (_e, item: TodoListItem) => {
    console.log('[main] todo_lists:saveItem', item)
    return itemRepo.saveItem(item)
  })
  ipcMain.handle('todo_lists:deleteItem', (_e, id: string) => {
    console.log('[main] todo_lists:deleteItem', id)
    return itemRepo.deleteItem(id)
  })
  ipcMain.handle('todo_lists:reorderItems', (_e, listId: string, orderedIds: string[]) => {
    console.log('[main] todo_lists:reorderItems', listId, orderedIds)
    return itemRepo.reorderItems(listId, orderedIds)
  })
}
