import { useMemo } from 'react'
import { Bell, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useRemindersStore } from '../../store/reminders.store'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { today, parseDateStr } from '../../utils/dates'

function formatUpcomingDate(dateStr: string): string {
  const t = today()
  const d = parseDateStr(dateStr)
  const diff = t.until(d, { largestUnit: 'days' }).days
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function LeftSidebar() {
  const leftOpen = useUIStore((s) => s.leftOpen)
  const setLeftOpen = useUIStore((s) => s.setLeftOpen)
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)

  const upcoming = useMemo(() => {
    const start = today()
    const end = start.add({ days: 30 })
    const items: { id: string; title: string; time?: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, time: r.time, dateStr })
      }
    }
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    return items
  }, [reminders])

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
      <div className="flex-1 overflow-y-auto">
        {leftOpen ? (
          upcoming.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-4 text-center">
              No upcoming reminders in the next 30 days.
            </p>
          ) : (
            <ul className="py-1">
              {upcoming.map((item, i) => (
                <li key={`${item.id}-${item.dateStr}-${i}`}>
                  <button
                    onClick={() => navigate(`/day/${item.dateStr}`)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-0.5">
                      {formatUpcomingDate(item.dateStr)}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                      {item.title}
                    </div>
                    {item.time && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">{item.time}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 pt-2">
            <Bell size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Add button */}
      {leftOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate(`/day/${today().toString()}`)}
            className="flex items-center gap-2 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus size={14} />
            Add Reminder
          </button>
        </div>
      )}
    </aside>
  )
}
