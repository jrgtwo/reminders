import { Bell, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useUIStore } from '../../store/ui.store'

export default function LeftSidebar() {
  const leftOpen = useUIStore((s) => s.leftOpen)
  const setLeftOpen = useUIStore((s) => s.setLeftOpen)

  return (
    <aside
      className={`flex flex-col border-r border-gray-200 dark:border-gray-700 transition-[width] duration-200 overflow-hidden ${
        leftOpen ? 'w-64' : 'w-12'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        {leftOpen && (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upcoming</span>
        )}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 ml-auto"
        >
          {leftOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {leftOpen ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-4 text-center">
            Upcoming reminders will appear here in Phase 6.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-2">
            <Bell size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Add button */}
      {leftOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button className="flex items-center gap-2 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <Plus size={14} />
            Add Reminder
          </button>
        </div>
      )}
    </aside>
  )
}
