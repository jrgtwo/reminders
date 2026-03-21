import { create } from 'zustand'
 import { persist } from 'zustand/middleware'

 type View = 'month' | 'week' | 'day'

 interface UIState {
   leftOpen: boolean
   rightOpen: boolean
   currentView: View
   selectedDate: string   // 'YYYY-MM-DD'
   darkMode: boolean
   setLeftOpen: (v: boolean) => void
   setRightOpen: (v: boolean) => void
   setView: (v: View) => void
   setSelectedDate: (d: string) => void
   toggleDarkMode: () => void
 }

 const today = () => new Date().toISOString().slice(0, 10)

 export const useUIStore = create<UIState>()(
   persist(
     (set) => ({
       leftOpen: true,
       rightOpen: true,
       currentView: 'month',
       selectedDate: today(),
       darkMode: false,
       setLeftOpen: (v) => set({ leftOpen: v }),
       setRightOpen: (v) => set({ rightOpen: v }),
       setView: (v) => set({ currentView: v }),
       setSelectedDate: (d) => set({ selectedDate: d }),
       toggleDarkMode: () =>
         set((s) => {
           const next = !s.darkMode
           document.documentElement.classList.toggle('dark', next)
           return { darkMode: next }
         }),
     }),
     {
       name: 'reminders-ui',
       partialize: (s) => ({
         leftOpen: s.leftOpen,
         rightOpen: s.rightOpen,
         currentView: s.currentView,
         darkMode: s.darkMode,
       }),
     }
   )
 )