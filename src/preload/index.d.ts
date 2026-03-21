export {}

 declare global {
   interface Window {
     electronAPI: {
       reminders: {
         getAll: () => Promise<import('../renderer/src/types/models').Reminder[]>
         getByDate: (date: string) =>
 Promise<import('../renderer/src/types/models').Reminder[]>
         save: (r: import('../renderer/src/types/models').Reminder) =>
 Promise<import('../renderer/src/types/models').Reminder>
         delete: (id: string) => Promise<void>
       }
       notes: {
         getByDate: (date: string) =>
 Promise<import('../renderer/src/types/models').Note | null>
         save: (n: import('../renderer/src/types/models').Note) =>
 Promise<import('../renderer/src/types/models').Note>
       }
       todos: {
         getAll: () => Promise<import('../renderer/src/types/models').Todo[]>
         save: (t: import('../renderer/src/types/models').Todo) =>
 Promise<import('../renderer/src/types/models').Todo>
         delete: (id: string) => Promise<void>
         reorder: (ids: string[]) => Promise<void>
       }
     }
   }
 }