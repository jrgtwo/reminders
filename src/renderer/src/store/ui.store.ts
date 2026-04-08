import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { capture } from '../lib/analytics'

type View = 'month' | 'week' | 'day'
export type Theme = 'light' | 'dark' | 'warm' | 'midnight' | 'dim' | 'nord' | 'forest' | 'dusk' | 'grey'
export type TimeFormat = '12h' | '24h'

interface UIState {
  leftOpen: boolean
  rightOpen: boolean
  currentView: View
  selectedDate: string   // 'YYYY-MM-DD'
  theme: Theme
  timeFormat: TimeFormat
  triggerNewTodo: boolean
  triggerNewReminder: boolean
  newReminderDate: string | null
  reminderSections: { overdue: boolean; upcoming: boolean }
  setLeftOpen: (v: boolean) => void
  setRightOpen: (v: boolean) => void
  setView: (v: View) => void
  setSelectedDate: (d: string) => void
  setTheme: (theme: Theme) => void
  setTimeFormat: (f: TimeFormat) => void
  setTriggerNewTodo: (v: boolean) => void
  setTriggerNewReminder: (v: boolean) => void
  setNewReminderDate: (date: string | null) => void
  setReminderSection: (section: 'overdue' | 'upcoming', open: boolean) => void
}

const THEME_CLASSES = ['theme-warm', 'theme-midnight', 'theme-dim', 'theme-nord', 'theme-forest', 'theme-dusk', 'theme-grey']

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', ...THEME_CLASSES)
  if (theme !== 'light') root.classList.add('dark')
  if (theme !== 'light' && theme !== 'dark') root.classList.add(`theme-${theme}`)
}

const today = () => new Date().toISOString().slice(0, 10)

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftOpen: true,
      rightOpen: true,
      currentView: 'month',
      selectedDate: today(),
      theme: 'dark',
      timeFormat: '12h',
      triggerNewTodo: false,
      triggerNewReminder: false,
      newReminderDate: null,
      reminderSections: { overdue: false, upcoming: false },
      setLeftOpen: (v) => set({ leftOpen: v }),
      setRightOpen: (v) => set({ rightOpen: v }),
      setView: (v) => { set({ currentView: v }); capture('ui_view_changed', { view: v }) },
      setSelectedDate: (d) => set({ selectedDate: d }),
      setTriggerNewTodo: (v) => set({ triggerNewTodo: v }),
      setTriggerNewReminder: (v) => set({ triggerNewReminder: v }),
      setNewReminderDate: (date) => set({ newReminderDate: date }),
      setReminderSection: (section, open) =>
        set((s) => ({ reminderSections: { ...s.reminderSections, [section]: open } })),
      setTheme: (theme) => {
        applyTheme(theme)
        capture('ui_theme_changed', { theme })
        set({ theme })
      },
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    {
      name: 'reminders-ui-v3',
      partialize: (s) => ({
        leftOpen: s.leftOpen,
        rightOpen: s.rightOpen,
        currentView: s.currentView,
        theme: s.theme,
        timeFormat: s.timeFormat,
      }),
    }
  )
)
