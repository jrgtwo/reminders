import { create } from 'zustand'
 import { immer } from 'zustand/middleware/immer'
 import type { Todo } from '../types/models'

 interface TodosState {
   todos: Todo[]
   loading: boolean
   load: () => Promise<void>
   save: (t: Todo) => Promise<void>
   remove: (id: string) => Promise<void>
   reorder: (orderedIds: string[]) => Promise<void>
 }

 export const useTodosStore = create<TodosState>()(
   immer((set, get) => ({
     todos: [],
     loading: false,

     load: async () => {
       const { getStorage } = await import('../platform')
       set((s) => { s.loading = true })
       const todos = await getStorage().getTodos()
       set((s) => { s.todos = todos; s.loading = false })
     },

     save: async (t) => {
       const { getStorage } = await import('../platform')
       const saved = await getStorage().saveTodo(t)
       set((s) => {
         const idx = s.todos.findIndex((x) => x.id === saved.id)
         if (idx >= 0) s.todos[idx] = saved
         else s.todos.push(saved)
       })
     },

     remove: async (id) => {
       const { getStorage } = await import('../platform')
       await getStorage().deleteTodo(id)
       set((s) => { s.todos = s.todos.filter((t) => t.id !== id) })
     },

     reorder: async (orderedIds) => {
       const { getStorage } = await import('../platform')
       const sorted = orderedIds
         .map((id, i) => {
           const t = get().todos.find((x) => x.id === id)
           return t ? { ...t, order: (i + 1) * 1000 } : null
         })
         .filter(Boolean) as Todo[]
       set((s) => { s.todos = sorted })
       await getStorage().reorderTodos(orderedIds)
     },
   }))
 )