import { useRef, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import SearchBar from './SearchBar'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export default function AppShell() {
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const focusSearch = useCallback(() => searchRef.current?.focus(), [])

  useKeyboardShortcuts(focusSearch)

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top header */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block shrink-0">
          Reminders
        </span>
        <div className="flex-1 flex justify-center">
          <SearchBar ref={searchRef} />
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
          title="Settings (Ctrl+,)"
        >
          <Settings size={16} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <div className="hidden md:flex">
          <LeftSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Right sidebar — desktop only */}
        <div className="hidden md:flex">
          <RightSidebar />
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
