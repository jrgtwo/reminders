import { contextBridge, ipcRenderer } from 'electron'

const api = {
  reminders: {
    getAll: () => ipcRenderer.invoke('reminders:getAll'),
    getByDate: (date: string) => ipcRenderer.invoke('reminders:getByDate', date),
    save: (r: unknown) => ipcRenderer.invoke('reminders:save', r),
    delete: (id: string) => ipcRenderer.invoke('reminders:delete', id)
  },
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getById: (id: string) => ipcRenderer.invoke('notes:getById', id),
    getByDate: (date: string) => ipcRenderer.invoke('notes:getByDate', date),
    getByFolder: (folderId: string) => ipcRenderer.invoke('notes:getByFolder', folderId),
    save: (n: unknown) => ipcRenderer.invoke('notes:save', n),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id)
  },
  noteFolders: {
    getAll: () => ipcRenderer.invoke('noteFolders:getAll'),
    save: (f: unknown) => ipcRenderer.invoke('noteFolders:save', f),
    delete: (id: string) => ipcRenderer.invoke('noteFolders:delete', id)
  },
  todoFolders: {
    getAll: () => ipcRenderer.invoke('todo_folders:getAll'),
    save: (f: unknown) => ipcRenderer.invoke('todo_folders:save', f),
    delete: (id: string) => ipcRenderer.invoke('todo_folders:delete', id)
  },
  todoLists: {
    getAll: () => ipcRenderer.invoke('todo_lists:getAll'),
    save: (l: unknown) => ipcRenderer.invoke('todo_lists:save', l),
    delete: (id: string) => ipcRenderer.invoke('todo_lists:delete', id),
    getAllItemsForList: (listId: string) =>
      ipcRenderer.invoke('todo_lists:getAllItemsForList', listId),
    saveItem: (item: unknown) => ipcRenderer.invoke('todo_lists:saveItem', item),
    deleteItem: (id: string) => ipcRenderer.invoke('todo_lists:deleteItem', id),
    reorderItems: (listId: string, ids: string[]) =>
      ipcRenderer.invoke('todo_lists:reorderItems', listId, ids)
  },
  snooze: {
    set: (reminderId: string, date: string, minutes: number) =>
      ipcRenderer.invoke('snooze:set', { reminderId, date, minutes }),
    getActive: () => ipcRenderer.invoke('snooze:getActive'),
  },
  auth: {
    openExternal: (url: string) => ipcRenderer.invoke('auth:openExternal', url),
    onCallback: (cb: (url: string) => void) => {
      ipcRenderer.on('auth:callback', (_, url: string) => cb(url))
    }
  },
  sync: {
    trigger: (session: unknown, config: unknown) =>
      ipcRenderer.invoke('sync:trigger', session, config),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    checkFirstLogin: (userId: string, session: unknown, config: unknown) =>
      ipcRenderer.invoke('sync:checkFirstLogin', userId, session, config),
    markFirstLoginDone: (userId: string) => ipcRenderer.invoke('sync:markFirstLoginDone', userId)
  },
  safeStorage: {
    saveKey: (userId: string, b64: string) => ipcRenderer.invoke('safeStorage:save', userId, b64),
    loadKey: (userId: string) => ipcRenderer.invoke('safeStorage:load', userId),
    clearKey: (userId: string) => ipcRenderer.invoke('safeStorage:clear', userId)
  },
  onNavigate: (cb: (path: string) => void) => {
    ipcRenderer.on('navigate', (_, path: string) => cb(path))
  },
  dialog: {
    save: (defaultName: string, data: string) =>
      ipcRenderer.invoke('dialog:save', { defaultName, data }),
    open: () => ipcRenderer.invoke('dialog:open')
  },
  preferences: {
    get: () => ipcRenderer.invoke('preferences:get'),
    set: (prefs: Record<string, unknown>) => ipcRenderer.invoke('preferences:set', prefs)
  }
}

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in webPreferences')
}
contextBridge.exposeInMainWorld('electronAPI', api)
