import { CheckSquare, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useUIStore } from '../../store/ui.store'

export default function RightSidebar() {
  const rightOpen = useUIStore((s) => s.rightOpen)
  const setRightOpen = useUIStore((s) => s.setRightOpen)

  return (
    <aside
      className={`flex flex-col border-l border-gray-200 dark:border-gray-700 transition-[width] duration-200 overflow-hidden ${
        rightOpen ? 'w-72' : 'w-12'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {rightOpen && (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2 flex-1">
            Todos
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {rightOpen ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            Todos list — Phase 5
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-2">
            <CheckSquare size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Add button */}
      {rightOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button className="flex items-center gap-2 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <Plus size={14} />
            Add Todo
          </button>
        </div>
      )}
    </aside>
  )
}
