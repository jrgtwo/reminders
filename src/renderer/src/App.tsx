import { lazy, Suspense, useState, useRef, useCallback } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import FirstLoginDialog from './components/sync/FirstLoginDialog'
import { RouterProvider, createMemoryRouter, createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import CalendarHeader from './components/calendar/CalendarHeader'
import MonthView from './components/calendar/MonthView'
import type { MonthViewHandle } from './components/calendar/MonthView'
import WeekView from './components/calendar/WeekView'
import type { WeekViewHandle } from './components/calendar/WeekView'
import DayView from './components/calendar/DayView'
import ErrorPage from './components/pages/ErrorPage'
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
const LandingPage = lazy(() => import('./components/pages/LandingPage'))
const PrivacyPolicyPage = lazy(() => import('./components/pages/PrivacyPolicyPage'))
const CaptchaPage = lazy(() => import('./components/pages/CaptchaPage'))
import { getConsent } from './lib/consent'
import { useCalendarPage } from './components/hooks/useCalendarPage'
import { useApp } from './components/hooks/useApp'
import PageLoader from './components/ui/PageLoader'

function CalendarPage() {
  const { displayDate, view, weekDays, handlePrev, handleNext, handleToday, handleNavigate, setView } =
    useCalendarPage()
  const monthRef = useRef<MonthViewHandle>(null)
  const weekRef = useRef<WeekViewHandle>(null)

  const onPrev = useCallback(() => {
    if (view === 'month' && monthRef.current) {
      monthRef.current.animateToMonth('right')
    } else if (view === 'week' && weekRef.current) {
      weekRef.current.animateToWeek('right')
    } else {
      handlePrev()
    }
  }, [view, handlePrev])

  const onNext = useCallback(() => {
    if (view === 'month' && monthRef.current) {
      monthRef.current.animateToMonth('left')
    } else if (view === 'week' && weekRef.current) {
      weekRef.current.animateToWeek('left')
    } else {
      handleNext()
    }
  }, [view, handleNext])

  const onMonthSelect = useCallback(
    (month: number) => {
      const target = displayDate.with({ month })
      if (monthRef.current) {
        monthRef.current.animateToDate(target)
      } else {
        handleNavigate(target)
      }
    },
    [displayDate, handleNavigate]
  )

  const onYearSelect = useCallback(
    (year: number) => {
      const target = displayDate.with({ year })
      if (monthRef.current) {
        monthRef.current.animateToDate(target)
      } else {
        handleNavigate(target)
      }
    },
    [displayDate, handleNavigate]
  )

  const onDateSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (view === 'week' && weekRef.current) {
        weekRef.current.animateToDate(date)
      } else {
        handleNavigate(date)
      }
    },
    [view, handleNavigate]
  )

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        displayDate={displayDate}
        view={view}
        weekDays={weekDays}
        onPrev={onPrev}
        onNext={onNext}
        onToday={handleToday}
        onViewChange={(v) => setView(v)}
        onMonthSelect={onMonthSelect}
        onYearSelect={onYearSelect}
        onDateSelect={onDateSelect}
      />
      {view === 'month' ? (
        <MonthView ref={monthRef} displayDate={displayDate} onSwipeLeft={handleNext} onSwipeRight={handlePrev} onNavigate={handleNavigate} />
      ) : (
        <WeekView ref={weekRef} displayDate={displayDate} onSwipeLeft={handleNext} onSwipeRight={handlePrev} onNavigate={handleNavigate} />
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
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const routes = [
  {
    path: '/captcha',
    element: <Lazy><CaptchaPage /></Lazy>,
    errorElement: <ErrorPage />
  },
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
      { path: 'month/:date', element: <CalendarPage /> },
      { path: 'week/:date', element: <CalendarPage /> },
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
