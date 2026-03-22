import { contextBridge, ipcRenderer } from 'electron'

const api = {
  reminders: {
    getAll:    ()             => ipcRenderer.invoke('reminders:getAll'),
    getByDate: (date: string) => ipcRenderer.invoke('reminders:getByDate', date),
    save:      (r: unknown)   => ipcRenderer.invoke('reminders:save', r),
    delete:    (id: string)   => ipcRenderer.invoke('reminders:delete', id),
  },
  notes: {
    getAll:    ()             => ipcRenderer.invoke('notes:getAll'),
    getByDate: (date: string) => ipcRenderer.invoke('notes:getByDate', date),
    save:      (n: unknown)   => ipcRenderer.invoke('notes:save', n),
  },
  todos: {
    getAll:   ()              => ipcRenderer.invoke('todos:getAll'),
    save:     (t: unknown)    => ipcRenderer.invoke('todos:save', t),
    delete:   (id: string)    => ipcRenderer.invoke('todos:delete', id),
    reorder:  (ids: string[]) => ipcRenderer.invoke('todos:reorder', ids),
  },
  auth: {
    openExternal: (url: string) => ipcRenderer.invoke('auth:openExternal', url),
    onCallback: (cb: (url: string) => void) => {
      ipcRenderer.on('auth:callback', (_, url: string) => cb(url))
    },
  },
  onNavigate: (cb: (path: string) => void) => {
    ipcRenderer.on('navigate', (_, path: string) => cb(path))
  },
  dialog: {
    save: (defaultName: string, data: string) =>
      ipcRenderer.invoke('dialog:save', { defaultName, data }),
    open: () => ipcRenderer.invoke('dialog:open'),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as any).electronAPI = api
}
