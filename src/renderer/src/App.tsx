import { Analytics } from '@vercel/analytics/react'
import FirstLoginDialog from './components/sync/FirstLoginDialog'
import { RouterProvider, createMemoryRouter, createBrowserRouter } from 'react-router-dom'
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
import { useCalendarPage } from './components/hooks/useCalendarPage'
import { useApp } from './components/hooks/useApp'

function CalendarPage() {
  const { displayDate, view, weekDays, handlePrev, handleNext, handleToday, setView } =
    useCalendarPage()

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        displayDate={displayDate}
        view={view}
        weekDays={weekDays}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
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
        children: [{ path: ':listId', element: <ListsView /> }]
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
  const { ready, authReady, isLoggedIn } = useApp(router)

  if (!ready || !authReady) return null

  if (!isElectronOrCapacitor && !isLoggedIn) return <SignInPage />

  return (
    <>
      <RouterProvider router={router} />
      <FirstLoginDialog />
      {!isElectronOrCapacitor && <Analytics />}
    </>
  )
}
