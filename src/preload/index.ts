 import { contextBridge, ipcRenderer } from 'electron'

 if (process.contextIsolated) {
   try {
     contextBridge.exposeInMainWorld('electronAPI', {
       reminders: {
         getAll:    ()         => ipcRenderer.invoke('reminders:getAll'),
         getByDate: (date: string) => ipcRenderer.invoke('reminders:getByDate',
 date),
         save:      (r: unknown)   => ipcRenderer.invoke('reminders:save', r),
         delete:    (id: string)   => ipcRenderer.invoke('reminders:delete', id),
       },
       notes: {
         getByDate: (date: string) => ipcRenderer.invoke('notes:getByDate', date),
         save:      (n: unknown)   => ipcRenderer.invoke('notes:save', n),
       },
       todos: {
         getAll:   ()              => ipcRenderer.invoke('todos:getAll'),
         save:     (t: unknown)    => ipcRenderer.invoke('todos:save', t),
         delete:   (id: string)    => ipcRenderer.invoke('todos:delete', id),
         reorder:  (ids: string[]) => ipcRenderer.invoke('todos:reorder', ids),
       },
     })
   } catch (error) {
     console.error(error)
   }
 } else {
   ;(window as any).electronAPI = {
     reminders: {
       getAll:    ()         => ipcRenderer.invoke('reminders:getAll'),
       getByDate: (date: string) => ipcRenderer.invoke('reminders:getByDate', date),
       save:      (r: unknown)   => ipcRenderer.invoke('reminders:save', r),
       delete:    (id: string)   => ipcRenderer.invoke('reminders:delete', id),
     },
     notes: {
       getByDate: (date: string) => ipcRenderer.invoke('notes:getByDate', date),
       save:      (n: unknown)   => ipcRenderer.invoke('notes:save', n),
     },
     todos: {
       getAll:   ()              => ipcRenderer.invoke('todos:getAll'),
       save:     (t: unknown)    => ipcRenderer.invoke('todos:save', t),
       delete:   (id: string)    => ipcRenderer.invoke('todos:delete', id),
       reorder:  (ids: string[]) => ipcRenderer.invoke('todos:reorder', ids),
     },
   }
 }