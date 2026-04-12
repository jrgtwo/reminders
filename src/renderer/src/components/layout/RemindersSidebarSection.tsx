import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { formatOverdueDate, formatUpcomingDate } from './hooks/useRightSidebar'

interface ReminderEntry {
  id: string
  dateStr: string
  title: string
  time?: string
}

function ReminderItem({
  id,
  dateStr,
  title,
  time,
  variant,
}: ReminderEntry & { variant: 'overdue' | 'upcoming' }) {
  const navigate = useNavigate()

  return (
    <li key={`${id}-${dateStr}`}>
      <button
        onClick={() => navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })}
        className={`w-full text-left px-3 py-2 rounded-xl transition-all group ${
          variant === 'overdue'
            ? 'bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08] hover:shadow-sm'
            : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm'
        }`}
      >
        <div
          className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-blue-500 dark:text-[#6498c8]/80'}`}
        >
          {variant === 'overdue' ? formatOverdueDate(dateStr) : formatUpcomingDate(dateStr)}
        </div>
        <div className="text-[12px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-[#f0f0f0]">
          {title}
        </div>
        {time && (
          <div className="text-[11px] text-slate-400 dark:text-white/55 mt-0.5">{time}</div>
        )}
      </button>
    </li>
  )
}

function ReminderGroup({
  label,
  items,
  accent,
  variant,
  defaultOpen = true,
}: {
  label: string
  items: ReminderEntry[]
  accent: 'red' | 'blue' | 'slate'
  variant: 'overdue' | 'upcoming'
  defaultOpen?: boolean
}) {
  if (items.length === 0) return null
  return (
    <CollapsibleSection label={label} count={items.length} accent={accent} defaultOpen={defaultOpen}>
      <ul className="flex flex-col gap-1 px-2 pb-1">
        {items.map((item, i) => (
          <ReminderItem key={`${item.id}-${item.dateStr}-${i}`} {...item} variant={variant} />
        ))}
      </ul>
    </CollapsibleSection>
  )
}

export default function RemindersSidebarSection({
  overdueReminders,
  upcomingReminders,
  overdueYesterday,
  overdueThisWeek,
  overdueOlder,
  upcomingToday,
  upcomingThisWeek,
  upcomingLater,
}: {
  overdueReminders: ReminderEntry[]
  upcomingReminders: ReminderEntry[]
  overdueYesterday: ReminderEntry[]
  overdueThisWeek: ReminderEntry[]
  overdueOlder: ReminderEntry[]
  upcomingToday: ReminderEntry[]
  upcomingThisWeek: ReminderEntry[]
  upcomingLater: ReminderEntry[]
}) {
  const navigate = useNavigate()

  return (
    <div className="py-1">
      <CollapsibleSection
        label="Reminders"
        count={overdueReminders.length + upcomingReminders.length}
        accent="blue"
        defaultOpen
        headerExtra={
          <button
            onClick={() => navigate('/reminders')}
            className="p-1 rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
            title="Go to Reminders"
          >
            <ArrowUpRight size={20} />
          </button>
        }
      >
        {overdueReminders.length === 0 && upcomingReminders.length === 0 && (
          <p className="text-[11px] text-slate-400 dark:text-white/50 px-4 py-2 text-center">
            No upcoming reminders
          </p>
        )}
        {overdueReminders.length > 0 && (
          <CollapsibleSection
            label="Overdue"
            count={overdueReminders.length}
            accent="red"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-0.5">
              <ReminderGroup label="Yesterday" items={overdueYesterday} accent="red" variant="overdue" />
              <ReminderGroup label="This Week" items={overdueThisWeek} accent="slate" variant="overdue" />
              <ReminderGroup label="Older" items={overdueOlder} accent="slate" variant="overdue" />
            </div>
          </CollapsibleSection>
        )}
        {upcomingReminders.length > 0 && (
          <CollapsibleSection
            label="Upcoming"
            count={upcomingReminders.length}
            accent="blue"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-0.5">
              <ReminderGroup label="Today" items={upcomingToday} accent="blue" variant="upcoming" />
              <ReminderGroup label="This Week" items={upcomingThisWeek} accent="slate" variant="upcoming" />
              <ReminderGroup label="Later" items={upcomingLater} accent="slate" variant="upcoming" />
            </div>
          </CollapsibleSection>
        )}
      </CollapsibleSection>
    </div>
  )
}
