export {}

declare global {
  interface Window {
    electronAPI: {
      reminders: {
        getAll: () => Promise<import('../renderer/src/types/models').Reminder[]>
        getByDate: (date: string) => Promise<import('../renderer/src/types/models').Reminder[]>
        save: (r: import('../renderer/src/types/models').Reminder) => Promise<import('../renderer/src/types/models').Reminder>
        delete: (id: string) => Promise<void>
      }
      notes: {
        getByDate: (date: string) => Promise<import('../renderer/src/types/models').Note | null>
        save: (n: import('../renderer/src/types/models').Note) => Promise<import('../renderer/src/types/models').Note>
      }
      todoFolders: {
        getAll: () => Promise<import('../renderer/src/types/models').TodoFolder[]>
        save: (f: import('../renderer/src/types/models').TodoFolder) => Promise<import('../renderer/src/types/models').TodoFolder>
        delete: (id: string) => Promise<void>
      }
      todoLists: {
        getAll: () => Promise<import('../renderer/src/types/models').TodoList[]>
        save: (l: import('../renderer/src/types/models').TodoList) => Promise<import('../renderer/src/types/models').TodoList>
        delete: (id: string) => Promise<void>
        getAllItemsForList: (listId: string) => Promise<import('../renderer/src/types/models').TodoListItem[]>
        saveItem: (item: import('../renderer/src/types/models').TodoListItem) => Promise<import('../renderer/src/types/models').TodoListItem>
        deleteItem: (id: string) => Promise<void>
        reorderItems: (listId: string, ids: string[]) => Promise<void>
      }
    }
  }
}
