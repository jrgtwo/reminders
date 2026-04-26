import { create } from 'zustand'
 import { immer } from 'zustand/middleware/immer'
 import type { Reminder } from '../types/models'
 import { capture } from '../lib/analytics'

 interface RemindersState {
   reminders: Reminder[]
   loading: boolean
   load: () => Promise<void>
   save: (r: Reminder) => Promise<void>
   remove: (id: string) => Promise<void>
   toggleComplete: (id: string, date: string) => Promise<void>
 }

 export const useRemindersStore = create<RemindersState>()(
   immer((set) => ({
     reminders: [],
     loading: false,

     load: async () => {
       const { getStorage } = await import('../platform')
       set((s) => { s.loading = true })
       const reminders = await getStorage().getReminders()
       set((s) => { s.reminders = reminders; s.loading = false })
     },

     save: async (r) => {
       const { getStorage } = await import('../platform')
       const isNew = !useRemindersStore.getState().reminders.find((x) => x.id === r.id)
       const saved = await getStorage().saveReminder(r)
       set((s) => {
         const idx = s.reminders.findIndex((x) => x.id === saved.id)
         if (idx >= 0) s.reminders[idx] = saved
         else s.reminders.push(saved)
       })
       capture(isNew ? 'reminder_created' : 'reminder_updated', {
         has_time: !!saved.startTime,
         has_recurrence: !!saved.recurrence,
         recurrence_frequency: saved.recurrence?.frequency ?? null,
       })
       try {
         const { Capacitor } = await import('@capacitor/core')
         if (Capacitor.isNativePlatform()) {
           const { reconcileNotifications } = await import('../lib/mobileNotifications')
           reconcileNotifications(useRemindersStore.getState().reminders).catch(console.error)

           // Cluster warning: when adding a new reminder fills the OS notification slots
           // for a 1-hour window, warn the user that this one may not actually alert.
           if (isNew && saved.startTime) {
             const { nextOccurrenceAt, SCHEDULE_HORIZON } = await import(
               '../../../shared/reminderSchedule'
             )
             const allReminders = useRemindersStore.getState().reminders
             const newFire = nextOccurrenceAt(saved, new Date())
             if (newFire) {
               const halfHourMs = 30 * 60 * 1000
               const start = newFire.getTime() - halfHourMs
               const end = newFire.getTime() + halfHourMs
               let count = 0
               for (const x of allReminders) {
                 if (x.id === saved.id) continue
                 const t = nextOccurrenceAt(x, new Date(start - 1))
                 if (t && t.getTime() >= start && t.getTime() <= end) count++
               }
               if (count >= SCHEDULE_HORIZON) {
                 const { useToastStore } = await import('./toast.store')
                 useToastStore
                   .getState()
                   .show(
                     "You've reached the maximum reminders for this 1-hour window — this one may not alert as a notification.",
                     'warning',
                   )
               }
             }
           }
         }
       } catch {
         // not a Capacitor build
       }
     },

     remove: async (id) => {
       const { getStorage } = await import('../platform')
       await getStorage().deleteReminder(id)
       set((s) => { s.reminders = s.reminders.filter((r) => r.id !== id) })
       capture('reminder_deleted')
       try {
         const { Capacitor } = await import('@capacitor/core')
         if (Capacitor.isNativePlatform()) {
           const { reconcileNotifications } = await import('../lib/mobileNotifications')
           reconcileNotifications(useRemindersStore.getState().reminders).catch(console.error)
         }
       } catch {
         // not a Capacitor build
       }
       // Propagate delete to Supabase so it doesn't come back on the next pull.
       if (!(window as any).electronAPI) {
         const { useAuthStore } = await import('./auth.store')
         const userId = useAuthStore.getState().user?.id
         if (userId) {
           const { webSoftDelete } = await import('../lib/webSync')
           webSoftDelete('reminders', id, userId).catch(console.error)
         }
       }
     },

     toggleComplete: async (id, date) => {
       const { getStorage } = await import('../platform')
       const wasCompleted = !!useRemindersStore.getState().reminders
         .find((x) => x.id === id)?.completedDates.includes(date)
       let updated: Reminder | null = null
       set((s) => {
         const r = s.reminders.find((x) => x.id === id)
         if (!r) return
         const idx = r.completedDates.indexOf(date)
         if (idx >= 0) r.completedDates.splice(idx, 1)
         else r.completedDates.push(date)
         r.updatedAt = new Date().toISOString()
         // Capture a plain object — Immer draft proxies must not escape the producer
         updated = { ...r, completedDates: [...r.completedDates] }
       })
       if (updated) {
         getStorage().saveReminder(updated)
         capture('reminder_toggled', { completed: !wasCompleted })
       }
     },
   }))
 )