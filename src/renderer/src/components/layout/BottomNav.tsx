import { Calendar, Bell, CheckSquare, FileText } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export const tabs = [
  { label: 'Calendar', icon: Calendar, path: '/' },
  { label: 'Reminders', icon: Bell, path: '/reminders' },
  { label: 'Lists', icon: CheckSquare, path: '/lists' },
  { label: 'Notes', icon: FileText, path: '/notes' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="lg:hidden flex border-t border-gray-200 dark:border-[var(--border)] bg-[var(--bg-surface)]">
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all active:translate-y-[1.5px] ${
              active
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

export function SideNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="hidden lg:flex flex-col border-r border-gray-200 dark:border-[var(--border)] bg-[var(--bg-surface)] w-16 shrink-0">
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            title={label}
            className={`flex flex-col items-center gap-1 py-4 text-[10px] transition-all active:translate-y-[1.5px] ${
              active
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
