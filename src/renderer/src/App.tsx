import { lazy, Suspense, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import FirstLoginDialog from './components/sync/FirstLoginDialog'
import { RouterProvider, createMemoryRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CalendarHeader from './components/calendar/CalendarHeader'
import MonthView from './components/calendar/MonthView'
import WeekView from './components/calendar/WeekView'
import DayView from './components/DayView'
import ErrorPage from './components/ErrorPage'
import CookieBanner from './components/CookieBanner'

const LANDING_SEEN_KEY = 'reminder_landing_seen'

const SettingsPage = lazy(() => import('./components/settings/SettingsPage'))
const RemindersPage = lazy(() => import('./components/mobile/RemindersPage'))
const TodosPage = lazy(() => import('./components/mobile/TodosPage'))
const ListsView = lazy(() => import('./components/lists/ListsPage'))
const ListsPage = lazy(() => import('./components/pages/ListsPage'))
const NoteView = lazy(() => import('./components/notes/NoteView'))
const NotesPage = lazy(() => import('./components/pages/NotesPage'))
const BrowsePage = lazy(() => import('./components/pages/BrowsePage'))
const LandingPage = lazy(() => import('./components/LandingPage'))
const PrivacyPolicyPage = lazy(() => import('./components/pages/PrivacyPolicyPage'))
import { getConsent } from './lib/consent'
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

function FirstVisitRedirect() {
  if (!localStorage.getItem(LANDING_SEEN_KEY)) {
    return <Navigate to="/welcome" replace />
  }
  return <CalendarPage />
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

const routes = [
  {
    path: '/welcome',
    element: <Lazy><LandingPage /></Lazy>,
    errorElement: <ErrorPage />
  },
  {
    path: '/privacy',
    element: <Lazy><PrivacyPolicyPage /></Lazy>,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <FirstVisitRedirect /> },
      { path: 'day/:date', element: <DayPage /> },
      { path: 'reminders', element: <Lazy><RemindersPage /></Lazy> },
      { path: 'todos', element: <Lazy><TodosPage /></Lazy> },
      {
        path: 'lists',
        element: <Lazy><ListsPage /></Lazy>,
        children: [{ path: ':listId', element: <Lazy><ListsView /></Lazy> }]
      },
      { path: 'browse', element: <Lazy><BrowsePage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
      {
        path: 'notes',
        element: <Lazy><NotesPage /></Lazy>,
        children: [
          { path: ':id', element: <Lazy><NoteView /></Lazy> },
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
  const [consentDecided, setConsentDecided] = useState(() => getConsent().decided)
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => getConsent().analytics)

  if (!ready || !authReady) return null

  const showBanner = !isElectronOrCapacitor && !consentDecided

  return (
    <>
      <RouterProvider router={router} />
      {isLoggedIn && <FirstLoginDialog />}
      {!isElectronOrCapacitor && analyticsAllowed && <Analytics />}
      {!isElectronOrCapacitor && analyticsAllowed && <SpeedInsights />}
      {showBanner && (
        <CookieBanner
          onDismiss={() => {
            setConsentDecided(true)
            setAnalyticsAllowed(getConsent().analytics)
          }}
        />
      )}
    </>
  )
}
