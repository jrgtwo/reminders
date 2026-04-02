import { useMemo } from 'react'
import { Bell, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { today as todayDate } from '../../utils/dates'
import { useRemindersStore } from '../../store/reminders.store'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { today, parseDateStr } from '../../utils/dates'

function formatOverdueDate(dateStr: string): string {
  const d = parseDateStr(dateStr)
  const t = today()
  const diff = d.until(t, { largestUnit: 'days' }).days
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

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
      className={`flex flex-col border-r border-slate-300/60 dark:border-white/[0.07] transition-[width] duration-200 overflow-hidden bg-[#F3F4F6] dark:bg-[#0d1117] ${
        leftOpen ? 'w-60' : 'w-11'
      }`}
    >
      {/* Header */}
      <div className="flex items-center px-3 py-2.5 border-b border-black/30 dark:border-black/60 bg-[#1c1f26] dark:bg-[#010409] shrink-0 h-11">
        {leftOpen && (
          <span className="text-[11px] font-semibold text-white/50 flex-1">
            Schedule
          </span>
        )}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className={`w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/[0.08] transition-all ${leftOpen ? '' : 'mx-auto'}`}
        >
          {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {leftOpen ? (
          <>
            {/* Overdue section */}
            {overdue.length > 0 && (
              <div className="border-b border-slate-200 dark:border-white/[0.07]">
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
                    Overdue
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/15 px-1.5 py-0.5 rounded-full">
                    {overdue.length}
                  </span>
                </div>
                <ul className="pb-3 flex flex-col gap-1 px-2">
                  {overdue.map((item, i) => (
                    <li key={`${item.id}-${item.dateStr}-${i}`}>
                      <button
                        onClick={() => navigate(`/day/${item.dateStr}`)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all group"
                      >
                        <div className="text-[11px] font-semibold text-red-400 dark:text-red-400/80 mb-0.5">
                          {formatOverdueDate(item.dateStr)}
                        </div>
                        <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                          {item.title}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upcoming section */}
            {upcoming.length === 0 && overdue.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-white/25 px-4 py-6 text-center leading-relaxed">
                No upcoming reminders<br />in the next 30 days
              </p>
            ) : upcoming.length > 0 ? (
              <div>
                <div className="px-4 pt-5 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/25">
                    Upcoming
                  </span>
                </div>
                <ul className="pb-3 flex flex-col gap-1 px-2">
                  {upcoming.map((item, i) => (
                    <li key={`${item.id}-${item.dateStr}-${i}`}>
                      <button
                        onClick={() => navigate(`/day/${item.dateStr}`)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all group"
                      >
                        <div className="text-[10px] font-semibold text-blue-500 dark:text-blue-400/80 mb-0.5">
                          {formatUpcomingDate(item.dateStr)}
                        </div>
                        <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                          {item.title}
                        </div>
                        {item.time && (
                          <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">
                            {item.time}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center pt-3">
            <Bell size={14} className="text-slate-300 dark:text-white/20" />
          </div>
        )}
      </div>

      {/* Add button */}
      {leftOpen && (
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.07] shrink-0">
          <button
            onClick={() => setNewReminderDate(todayDate().toString())}
            className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] px-3 py-2 rounded-lg transition-all"
          >
            <Plus size={13} />
            Add Reminder
          </button>
        </div>
      )}
    </aside>
  )
}
