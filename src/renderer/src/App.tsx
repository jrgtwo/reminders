import { useEffect, useMemo, useState } from 'react'
import { RouterProvider, createMemoryRouter, createBrowserRouter } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { initStorage } from './platform'
import { useUIStore } from './store/ui.store'
import { useRemindersStore } from './store/reminders.store'
import AppShell from './components/layout/AppShell'
import CalendarHeader from './components/calendar/CalendarHeader'
import MonthView from './components/calendar/MonthView'
import WeekView from './components/calendar/WeekView'
import DayView from './components/DayView'
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeekDays,
  today,
  parseDateStr,
} from './utils/dates'

function CalendarPage() {
  const selectedDateStr = useUIStore((s) => s.selectedDate)
  const currentView = useUIStore((s) => s.currentView)
  const setView = useUIStore((s) => s.setView)
  const load = useRemindersStore((s) => s.load)

  const [displayDate, setDisplayDate] = useState<Temporal.PlainDate>(() =>
    parseDateStr(selectedDateStr),
  )

  useEffect(() => {
    load()
  }, [load])

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
        onToday={() => setDisplayDate(today())}
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
function SettingsPage() {
  return <div className="p-6 text-gray-500 dark:text-gray-400">Settings — Phase 8</div>
}

const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'day/:date', element: <DayPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]

const isElectronOrCapacitor =
  typeof window !== 'undefined' &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor?.isNativePlatform?.())

const router = isElectronOrCapacitor
  ? createMemoryRouter(routes)
  : createBrowserRouter(routes)

export default function App() {
  const [ready, setReady] = useState(false)
  const darkMode = useUIStore((s) => s.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    initStorage().then(() => setReady(true))
  }, [])

  if (!ready) return null

  return <RouterProvider router={router} />
}
