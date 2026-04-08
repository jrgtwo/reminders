import { useEffect, useMemo, useState } from 'react'
import { useNotifications } from './hooks/useNotifications'
import { useAuthStore } from './store/auth.store'
import { identifyUser, resetUser } from './lib/analytics'
import { Analytics } from '@vercel/analytics/react'
import { useSyncStore } from './store/sync.store'
import FirstLoginDialog from './components/sync/FirstLoginDialog'
import {
  RouterProvider,
  createMemoryRouter,
  createBrowserRouter,
  useNavigate
} from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { initStorage } from './platform'
import { useUIStore } from './store/ui.store'
import { useRemindersStore } from './store/reminders.store'
import { useNotesStore } from './store/notes.store'
import AppShell from './components/layout/AppShell'
import SignInPage from './components/SignInPage'
import CalendarHeader from './components/calendar/CalendarHeader'
import MonthView from './components/calendar/MonthView'
import WeekView from './components/calendar/WeekView'
import DayView from './components/DayView'
import SettingsPage from './components/settings/SettingsPage'
import RemindersPage from './components/mobile/RemindersPage'
import TodosPage from './components/mobile/TodosPage'
import ListsView from './components/lists/ListsPage'
import ListsPage from './components/pages/ListsPage'
import NoteView from './components/notes/NoteView'
import NotesPage from './components/pages/NotesPage'
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeekDays,
  today,
  parseDateStr
} from './utils/dates'

function CalendarPage() {
  const navigate = useNavigate()
  const selectedDateStr = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  const currentView = useUIStore((s) => s.currentView)
  const setView = useUIStore((s) => s.setView)
  const load = useRemindersStore((s) => s.load)
  const loadNotes = useNotesStore((s) => s.loadNotes)

  const [displayDate, setDisplayDate] = useState<Temporal.PlainDate>(() =>
    parseDateStr(selectedDateStr)
  )

  useEffect(() => {
    load()
    loadNotes()
  }, [load, loadNotes])

  const view: 'month' | 'week' = currentView === 'week' ? 'week' : 'month'
  const weekDays = useMemo(() => getWeekDays(displayDate), [displayDate])

  function handlePrev() {
    setDisplayDate((d: Temporal.PlainDate) => (view === 'week' ? subWeeks(d, 1) : subMonths(d, 1)))
  }

  function handleNext() {
    setDisplayDate((d: Temporal.PlainDate) => (view === 'week' ? addWeeks(d, 1) : addMonths(d, 1)))
  }

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        displayDate={displayDate}
        view={view}
        weekDays={weekDays}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => {
          const t = today()
          setDisplayDate(t)
          setSelectedDate(t.toString())
          navigate(`/day/${t.toString()}`)
        }}
        onViewChange={(v) => setView(v)}
      />
      {view === 'month' ? (
        <MonthView displayDate={displayDate} />
      ) : (
        <WeekView displayDate={displayDate} />
      )}
    </div>
  )
}
function DayPage() {
  return <DayView />
}

const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'day/:date', element: <DayPage /> },
      { path: 'reminders', element: <RemindersPage /> },
      { path: 'todos', element: <TodosPage /> },
      {
        path: 'lists',
        element: <ListsPage />,
        children: [
          { path: ':listId', element: <ListsView /> }
        ]
      },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'notes',
        element: <NotesPage />,
        children: [
          { path: ':id', element: <NoteView /> },
          { path: 'folder/:folderId', element: null }
        ]
      }
    ]
  }
]

const isElectronOrCapacitor =
  typeof window !== 'undefined' &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor?.isNativePlatform?.())

const router = isElectronOrCapacitor ? createMemoryRouter(routes) : createBrowserRouter(routes)

export default function App() {
  const [ready, setReady] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const initAuth = useAuthStore((s) => s.init)
  const initSync = useSyncStore((s) => s.init)
  useNotifications()

  useEffect(() => {
    setTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    initStorage()
      .then(() => setReady(true))
      .catch(() => setReady(true))
    initAuth()
      .then(() => setAuthReady(true))
      .catch((err) => {
        console.error('[auth] init failed:', err)
        setAuthReady(true) // unblock the render — isLoggedIn will be false, showing SignInPage
      })
    initSync()
  }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onNavigate) return
    api.onNavigate((path: string) => router.navigate(path))
  }, [])

  useEffect(() => {
    return useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn && state.user) {
        identifyUser(state.user.id)
      }
      if (prev.isLoggedIn && !state.isLoggedIn) {
        resetUser()
      }
    })
  }, [])

  if (!ready || !authReady) return null

  if (!isElectronOrCapacitor && !isLoggedIn) return <SignInPage />

  return (
    <>
      <RouterProvider router={router} />
      <FirstLoginDialog />
      <Analytics />
    </>
  )
}
