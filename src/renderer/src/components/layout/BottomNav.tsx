import { Calendar, Bell, CheckSquare } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Calendar', icon: Calendar, path: '/' },
  { label: 'Reminders', icon: Bell, path: '/reminders' },
  { label: 'Todos', icon: CheckSquare, path: '/todos' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="md:hidden flex border-t border-gray-200 dark:border-gray-700 bg-[var(--bg-surface)]">
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
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
