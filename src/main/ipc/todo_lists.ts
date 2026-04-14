import { ipcMain } from 'electron'
import * as repo from '../storage/todo_lists.repo'
import * as itemRepo from '../storage/todo_list_items.repo'
import { TodoListSchema, TodoListItemSchema, Id } from './schemas'
import { z } from 'zod'

export function registerTodoListHandlers() {
  ipcMain.handle('todo_lists:getAll', () => repo.getAllLists())
  ipcMain.handle('todo_lists:save', (_e, l: unknown) => {
    const list = TodoListSchema.parse(l)
    return repo.saveList(list)
  })
  ipcMain.handle('todo_lists:delete', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.deleteList(validId)
  })

  ipcMain.handle('todo_lists:getAllItemsForList', (_e, listId: unknown) => {
    const validId = Id.parse(listId)
    return itemRepo.getAllItemsForList(validId)
  })
  ipcMain.handle('todo_lists:saveItem', (_e, item: unknown) => {
    const validItem = TodoListItemSchema.parse(item)
    return itemRepo.saveItem(validItem)
  })
  ipcMain.handle('todo_lists:deleteItem', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return itemRepo.deleteItem(validId)
  })
  ipcMain.handle('todo_lists:reorderItems', (_e, listId: unknown, orderedIds: unknown) => {
    const validListId = Id.parse(listId)
    const validIds = z.array(Id).parse(orderedIds)
    return itemRepo.reorderItems(validListId, validIds)
  })
}
