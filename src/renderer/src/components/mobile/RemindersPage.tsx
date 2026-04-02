import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRemindersStore } from '../../store/reminders.store'
import { useUIStore } from '../../store/ui.store'
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

export default function RemindersPage() {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)

  const overdue = useMemo(() => {
    const start = today().subtract({ days: 365 })
    const end = today().subtract({ days: 1 })
    const items: { id: string; title: string; dateStr: string }[] = []
    for (const r of reminders) {
      for (const dateStr of getOccurrencesInRange(r, start, end)) {
        items.push({ id: r.id, title: r.title, dateStr })
      }
    }
    return items.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
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
    return items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
  }, [reminders])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/[0.07]">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Schedule</span>
        <button
          onClick={() => setNewReminderDate(today().toString())}
          className="flex items-center gap-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-400"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {overdue.length === 0 && upcoming.length === 0 ? (
          <p className="text-[13px] text-slate-400 dark:text-white/25 text-center py-12">
            No upcoming reminders in the next 30 days
          </p>
        ) : (
          <>
            {overdue.length > 0 && (
              <div className="border-b border-slate-200 dark:border-white/[0.07]">
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500 dark:text-red-400">Overdue</span>
                  <span className="ml-auto text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/15 px-1.5 py-0.5 rounded-full">
                    {overdue.length}
                  </span>
                </div>
                <ul className="pb-3 flex flex-col gap-1 px-2">
                  {overdue.map((item, i) => (
                    <li key={`${item.id}-${item.dateStr}-${i}`}>
                      <button
                        onClick={() => navigate(`/day/${item.dateStr}`)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-all"
                      >
                        <div className="text-[10px] font-semibold text-red-400 mb-0.5 uppercase tracking-wide">{item.dateStr}</div>
                        <div className="text-[14px] font-medium text-slate-700 dark:text-white/75 truncate">{item.title}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <div className="px-4 pt-5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-white/25">Upcoming</span>
                </div>
                <ul className="pb-4 flex flex-col gap-1 px-2">
                  {upcoming.map((item, i) => (
                    <li key={`${item.id}-${item.dateStr}-${i}`}>
                      <button
                        onClick={() => navigate(`/day/${item.dateStr}`)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all"
                      >
                        <div className="text-[10px] font-semibold text-blue-500 dark:text-blue-400/80 mb-0.5">{formatUpcomingDate(item.dateStr)}</div>
                        <div className="text-[14px] font-medium text-slate-700 dark:text-white/75 truncate">{item.title}</div>
                        {item.time && <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{item.time}</div>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
