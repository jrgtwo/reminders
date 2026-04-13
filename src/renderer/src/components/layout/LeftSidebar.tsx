import { Bell } from 'lucide-react'
import { today as todayDate } from '../../utils/dates'
import { useLeftSidebar, formatOverdueDate, formatUpcomingDate } from './hooks/useLeftSidebar'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import SidebarAddButton from '../ui/SidebarAddButton'
import SidebarHeader from '../ui/SidebarHeader'

export default function LeftSidebar() {
  const {
    leftOpen,
    setLeftOpen,
    width,
    asideRef,
    onResizeStart,
    setNewReminderDate,
    reminderSections,
    setReminderSection,
    navigate,
    overdue,
    upcoming,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingToday,
    upcomingThisWeek,
    upcomingLater,
    overdueSubOpen,
    setOverdueSubOpen,
    upcomingSubOpen,
    setUpcomingSubOpen,
  } = useLeftSidebar()

  function ReminderItem({
    id,
    dateStr,
    title,
    time,
    variant
  }: {
    id: string
    dateStr: string
    title: string
    time?: string
    variant: 'overdue' | 'upcoming'
  }) {
    return (
      <li key={`${id}-${dateStr}`}>
        <button
          onClick={() => navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })}
          className={`w-full text-left px-3 py-2.5 rounded-xl btn-3d group hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 grain-surface ${
            variant === 'overdue'
              ? 'bg-white dark:bg-white/[0.04] border border-red-200/60 dark:border-[#e8a045]/[0.12] border-b-[2.5px] border-b-red-300/60 dark:border-b-[#e8a045]/[0.25] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08]'
              : 'bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] hover:bg-slate-50 dark:hover:bg-white/[0.07]'
          }`}
        >
          <div
            className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-[var(--color-upcoming)]'}`}
          >
            {variant === 'overdue' ? formatOverdueDate(dateStr) : formatUpcomingDate(dateStr)}
          </div>
          <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-[#f0f0f0]">
            {title}
          </div>
          {time && (
            <div className="text-[11px] text-slate-400 dark:text-white/55 mt-0.5">{time}</div>
          )}
        </button>
      </li>
    )
  }

  return (
    <aside
      ref={asideRef}
      className="relative h-full flex flex-col border-r border-slate-300/60 dark:border-white/[0.07] overflow-hidden bg-[var(--bg-app)] transition-[width] duration-200"
      style={{ width: leftOpen ? width : 44 }}
    >
      {/* Header */}
      <SidebarHeader
        title="Schedule"
        collapsed={!leftOpen}
        onToggle={() => setLeftOpen(!leftOpen)}
        side="left"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {leftOpen ? (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <div className="border-b-2 border-slate-200 dark:border-white/[0.07] pt-3 pb-2">
                <CollapsibleSection
                  label="Overdue"
                  count={overdue.length}
                  accent="red"
                  open={reminderSections.overdue}
                  onOpenChange={(v) => setReminderSection('overdue', v)}
                >
                  <div className="flex flex-col gap-1 pl-2">
                    {overdueYesterday.length > 0 && (
                      <CollapsibleSection
                        label="Yesterday"
                        count={overdueYesterday.length}
                        accent="red"
                        indent
                        open={overdueSubOpen === 'yesterday'}
                        onOpenChange={(v) => setOverdueSubOpen(v ? 'yesterday' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueYesterday.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
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
                        open={overdueSubOpen === 'thisweek'}
                        onOpenChange={(v) => setOverdueSubOpen(v ? 'thisweek' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueThisWeek.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
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
                        open={overdueSubOpen === 'older'}
                        onOpenChange={(v) => setOverdueSubOpen(v ? 'older' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {overdueOlder.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
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

            {/* Upcoming */}
            {upcoming.length === 0 && overdue.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-white/50 px-4 py-6 text-center leading-relaxed">
                No upcoming reminders
                <br />
                in the next 30 days
              </p>
            ) : upcoming.length > 0 ? (
              <div className="pt-3 pb-2">
                <CollapsibleSection
                  label="Upcoming"
                  count={upcoming.length}
                  accent="blue"
                  open={reminderSections.upcoming}
                  onOpenChange={(v) => setReminderSection('upcoming', v)}
                >
                  <div className="flex flex-col gap-1 pl-2">
                    {upcomingToday.length > 0 && (
                      <CollapsibleSection
                        label="Today"
                        count={upcomingToday.length}
                        accent="blue"
                        indent
                        open={upcomingSubOpen === 'today'}
                        onOpenChange={(v) => setUpcomingSubOpen(v ? 'today' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {upcomingToday.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
                              variant="upcoming"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                    {upcomingThisWeek.length > 0 && (
                      <CollapsibleSection
                        label="This Week"
                        count={upcomingThisWeek.length}
                        accent="slate"
                        indent
                        open={upcomingSubOpen === 'thisweek'}
                        onOpenChange={(v) => setUpcomingSubOpen(v ? 'thisweek' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {upcomingThisWeek.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
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
                        open={upcomingSubOpen === 'later'}
                        onOpenChange={(v) => setUpcomingSubOpen(v ? 'later' : null)}
                      >
                        <ul className="flex flex-col gap-1 px-2 pb-1">
                          {upcomingLater.map((item, i) => (
                            <ReminderItem
                              key={`${item.id}-${item.dateStr}-${i}`}
                              {...item}
                              variant="upcoming"
                            />
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}
                  </div>
                </CollapsibleSection>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center pt-3">
            <Bell size={20} className="text-slate-300 dark:text-white/50" />
          </div>
        )}
      </div>

      {/* Resize handle */}
      {leftOpen && (
        <div
          onMouseDown={onResizeStart}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)]/30 transition-colors"
        />
      )}

      {/* Bottom nav */}
      {leftOpen && (
        <SidebarAddButton label="Add Reminder" onClick={() => setNewReminderDate(todayDate().toString())} />
      )}
    </aside>
  )
}
