import { useMemo } from 'react'
import { Bell, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { today as todayDate } from '../../utils/dates'
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
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)

  const overdue = useMemo(() => {
    const start = todayDate().subtract({ days: 365 })
    const end = todayDate().subtract({ days: 1 })
    const items: { id: string; title: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, dateStr })
      }
    }
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    return items
  }, [reminders])

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
      className={`flex flex-col border-r border-gray-200 dark:border-white/[0.1] transition-[width] duration-200 overflow-hidden bg-gray-50 dark:bg-[#040811] ${
        leftOpen ? 'w-64' : 'w-12'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-900/20 dark:border-white/[0.08] bg-gray-900 dark:bg-[#040811]">
        {leftOpen && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Schedule</span>
        )}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white ml-auto transition-all"
        >
          {leftOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {leftOpen ? (
          <>
            {/* Overdue section */}
            {overdue.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/40 border-b-2 border-red-200 dark:border-red-500/30">
                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                    ⚠ Overdue
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full">
                    {overdue.length}
                  </span>
                </div>
                <ul>
                  {overdue.map((item, i) => (
                    <li key={`${item.id}-${item.dateStr}-${i}`}>
                      <button
                        onClick={() => navigate(`/day/${item.dateStr}`)}
                        className="w-full text-left px-3 py-2 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all"
                      >
                        <div className="text-xs font-medium text-red-500 dark:text-red-400/80 mb-0.5">
                          {item.dateStr}
                        </div>
                        <div className="text-sm font-medium text-red-900 dark:text-red-200 truncate">{item.title}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Upcoming section */}
            {upcoming.length === 0 && overdue.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-white/30 px-3 py-4 text-center">
                No upcoming reminders in the next 30 days.
              </p>
            ) : upcoming.length > 0 ? (
              <ul className="py-1">
                {upcoming.map((item, i) => (
                  <li key={`${item.id}-${item.dateStr}-${i}`}>
                    <button
                      onClick={() => navigate(`/day/${item.dateStr}`)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
                    >
                      <div className="text-xs font-medium text-blue-500 dark:text-blue-300/80 mb-0.5">
                        {formatUpcomingDate(item.dateStr)}
                      </div>
                      <div className="text-sm text-gray-800 dark:text-white/80 truncate">{item.title}</div>
                      {item.time && (
                        <div className="text-xs text-gray-400 dark:text-white/30">{item.time}</div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-2">
            <Bell size={16} className="text-gray-400 dark:text-white/30" />
          </div>
        )}
      </div>

      {/* Add button */}
      {leftOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-white/[0.07]">
          <button
            onClick={() => setNewReminderDate(todayDate().toString())}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.14] border border-gray-200 dark:border-white/[0.12] px-3 py-2 rounded-lg transition-all"
          >
            <Plus size={14} />
            Add Reminder
          </button>
        </div>
      )}
    </aside>
  )
}
