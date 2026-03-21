import { useEffect, useState } from 'react'
import { RouterProvider, createMemoryRouter, createBrowserRouter } from 'react-router-dom'
import { initStorage } from './platform'
import { useUIStore } from './store/ui.store'
import AppShell from './components/layout/AppShell'

function CalendarPage() {
  return <div className="p-6 text-gray-500 dark:text-gray-400">Calendar — Phase 3</div>
}
function DayPage() {
  return <div className="p-6 text-gray-500 dark:text-gray-400">Day View — Phase 4</div>
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
