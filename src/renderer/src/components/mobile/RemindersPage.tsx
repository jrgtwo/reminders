import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, Check, Clock, RefreshCw, SkipForward, Trash2 } from 'lucide-react'
import { today } from '../../utils/dates'
import type { ReactNode } from 'react'
import {
  useMobileRemindersPage,
  formatOverdueDate,
  formatUpcomingDate,
  type ScheduleItem
} from './hooks/useMobileRemindersPage'
import SidebarAddButton from '../ui/SidebarAddButton'
import MobilePageHeader from '../ui/MobilePageHeader'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'

type Accent = 'red' | 'blue' | 'slate'

const accentStyles: Record<Accent, { label: string; count: string; chevron: string }> = {
  red: {
    label: 'text-red-500 dark:text-[#e8a045]',
    count: 'text-red-500 dark:text-[#e8a045] bg-red-50 dark:bg-[#e8a045]/[0.08]',
    chevron: 'text-[#e8a045]/60'
  },
  blue: {
    label: 'text-blue-500 dark:text-[#6498c8]',
    count: 'text-blue-500 dark:text-[#6498c8] bg-blue-50 dark:bg-[#6498c8]/[0.08]',
    chevron: 'text-[#6498c8]/60'
  },
  slate: {
    label: 'text-slate-400 dark:text-white/25',
    count: 'text-slate-500 dark:text-white/30 bg-slate-100 dark:bg-white/[0.06]',
    chevron: 'text-slate-300 dark:text-white/20'
  }
}

function CollapsibleSection({
  label,
  count,
  accent,
  defaultOpen = true,
  indent = false,
  children
}: {
  label: string
  count: number
  accent: Accent
  defaultOpen?: boolean
  indent?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const s = accentStyles[accent]

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 w-full text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-lg ${indent ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      >
        <span className={`text-xs font-bold uppercase tracking-wide flex-1 ${s.label}`}>
          {label}
        </span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${s.count}`}>{count}</span>
        {open ? (
          <ChevronUp size={20} className={s.chevron} />
        ) : (
          <ChevronDown size={20} className={s.chevron} />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

export default function RemindersPage() {
  const location = useLocation()
  const navSection = (location.state as { section?: string } | null)?.section

  const {
    navigate,
    reminders,
    toggleComplete,
    handleDeleteReminder,
    reminderDelete,
    setNewReminderDate,
    overdue,
    todayItems,
    upcoming,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingThisWeek,
    upcomingLater,
    isEmpty,
    handleSnooze
  } = useMobileRemindersPage()

  // When navigating from header counts, auto-open the first available sub-section
  const autoOpenOverdue = navSection === 'overdue'
  const autoOpenUpcoming = navSection === 'upcoming'
  const firstOverdueSub = overdueYesterday.length > 0
    ? 'yesterday'
    : overdueThisWeek.length > 0
      ? 'thisWeek'
      : overdueOlder.length > 0
        ? 'older'
        : null
  const firstUpcomingSub = upcomingThisWeek.length > 0
    ? 'thisWeek'
    : upcomingLater.length > 0
      ? 'later'
      : null

  function ReminderRow({
    item,
    variant
  }: {
    item: ScheduleItem
    variant: 'overdue' | 'today' | 'upcoming'
  }) {
    const isCompleted =
      reminders.find((r) => r.id === item.id)?.completedDates.includes(item.dateStr) ?? false

    return (
      <li>
        <div
          className={`flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all group ${
            variant === 'overdue'
              ? 'bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
              : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
          } ${isCompleted ? 'opacity-50' : ''}`}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleComplete(item.id, item.dateStr)
            }}
            className={`mt-[3px] w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-[#f0f0f0]'
                : variant === 'overdue'
                  ? 'border-[#e8a045]/50 dark:border-[#e8a045]/30 hover:border-emerald-400'
                  : 'border-slate-300 dark:border-white/20 hover:border-emerald-400'
            }`}
          >
            {isCompleted && <Check size={20} strokeWidth={3} />}
          </button>

          {/* Content — clicking navigates to that day */}
          <button
            onClick={() => navigate(`/day/${item.dateStr}`, { state: { tab: 'reminders' } })}
            className="flex-1 text-left min-w-0"
          >
            {variant !== 'today' && (
              <div
                className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-blue-500 dark:text-[#6498c8]/80'}`}
              >
                {variant === 'overdue'
                  ? formatOverdueDate(item.dateStr)
                  : formatUpcomingDate(item.dateStr)}
              </div>
            )}
            <div
              className={`text-[13px] font-medium truncate group-hover:text-slate-900 dark:group-hover:text-white ${isCompleted ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-700 dark:text-white/75'}`}
            >
              {item.title}
            </div>
            {item.description && (
              <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5 truncate">
                {item.description}
              </div>
            )}
            {(item.startTime || item.isRecurring) && (
              <div className="flex items-center gap-1.5 mt-1">
                {item.startTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                    <Clock size={20} />
                    {item.startTime}
                  </span>
                )}
                {item.isRecurring && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">
                    <RefreshCw size={20} />
                    {item.recurrence?.frequency}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Snooze — overdue only, appears on hover */}
          {variant === 'overdue' && !isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSnooze(item)
              }}
              title={item.isRecurring ? 'Skip this occurrence' : 'Snooze to tomorrow'}
              className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-[#e8a045] hover:bg-[#e8a045]/10"
            >
              <SkipForward size={20} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteReminder(item.id, e)
            }}
            title="Delete reminder"
            className="mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {/* Header */}
      <MobilePageHeader
        title="Schedule"
        actions={
          <button
            onClick={() => setNewReminderDate(today().toString())}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <Plus size={20} />
            Add
          </button>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <p className="text-[12px] text-slate-400 dark:text-white/25 px-4 py-6 text-center leading-relaxed">
            No reminders
            <br />
            in the next 30 days
          </p>
        ) : (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <div key={`overdue-${navSection}`} className="border-b border-slate-200 dark:border-white/[0.07] pt-3 pb-2">
                <CollapsibleSection label="Overdue" count={overdue.length} accent="red">
                  <div className="flex flex-col gap-1 pl-2">
                    {overdueYesterday.length > 0 && (
                      <CollapsibleSection
                        label="Yesterday"
                        count={overdueYesterday.length}
                        accent="red"
                        indent
                        defaultOpen={autoOpenOverdue && firstOverdueSub === 'yesterday'}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueYesterday.map((item, i) => (
                            <ReminderRow
                              key={`${item.id}-${item.dateStr}-${i}`}
                              item={item}
                              variant="overdue"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                    {overdueThisWeek.length > 0 && (
                      <CollapsibleSection
                        label="This Week"
                        count={overdueThisWeek.length}
                        accent="slate"
                        indent
                        defaultOpen={autoOpenOverdue && firstOverdueSub === 'thisWeek'}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueThisWeek.map((item, i) => (
                            <ReminderRow
                              key={`${item.id}-${item.dateStr}-${i}`}
                              item={item}
                              variant="overdue"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                    {overdueOlder.length > 0 && (
                      <CollapsibleSection
                        label="Older"
                        count={overdueOlder.length}
                        accent="slate"
                        indent
                        defaultOpen={autoOpenOverdue && firstOverdueSub === 'older'}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueOlder.map((item, i) => (
                            <ReminderRow
                              key={`${item.id}-${item.dateStr}-${i}`}
                              item={item}
                              variant="overdue"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Today — top-level, open by default */}
            {todayItems.length > 0 && (
              <div className="border-b border-slate-200 dark:border-white/[0.07] pt-3 pb-2">
                <CollapsibleSection
                  label="Today"
                  count={todayItems.length}
                  accent="blue"
                  defaultOpen={true}
                >
                  <ul className="flex flex-col gap-1 px-2 pb-1">
                    {todayItems.map((item, i) => (
                      <ReminderRow
                        key={`${item.id}-${item.dateStr}-${i}`}
                        item={item}
                        variant="today"
                      />
                    ))}
                  </ul>
                </CollapsibleSection>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div key={`upcoming-${navSection}`} className="pt-3 pb-2">
                <CollapsibleSection label="Upcoming" count={upcoming.length} accent="blue">
                  <div className="flex flex-col gap-1 pl-2">
                    {upcomingThisWeek.length > 0 && (
                      <CollapsibleSection
                        label="This Week"
                        count={upcomingThisWeek.length}
                        accent="slate"
                        indent
                        defaultOpen={autoOpenUpcoming && firstUpcomingSub === 'thisWeek'}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {upcomingThisWeek.map((item, i) => (
                            <ReminderRow
                              key={`${item.id}-${item.dateStr}-${i}`}
                              item={item}
                              variant="upcoming"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                    {upcomingLater.length > 0 && (
                      <CollapsibleSection
                        label="Later"
                        count={upcomingLater.length}
                        accent="slate"
                        indent
                        defaultOpen={autoOpenUpcoming && firstUpcomingSub === 'later'}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {upcomingLater.map((item, i) => (
                            <ReminderRow
                              key={`${item.id}-${item.dateStr}-${i}`}
                              item={item}
                              variant="upcoming"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <SidebarAddButton label="Add Reminder" onClick={() => setNewReminderDate(today().toString())} />

      {reminderDelete.pendingId && (
        <ConfirmDeleteDialog
          message={reminderDelete.pendingMessage}
          anchorRect={reminderDelete.anchorRect}
          onConfirm={reminderDelete.confirmDelete}
          onCancel={reminderDelete.cancelDelete}
        />
      )}
    </div>
  )
}
