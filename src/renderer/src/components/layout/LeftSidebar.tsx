import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { today as todayDate } from '../../utils/dates'
import { useLeftSidebar, formatOverdueDate, formatUpcomingDate } from './hooks/useLeftSidebar'

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

interface CollapsibleSectionProps {
  label: string
  count: number
  accent: Accent
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  indent?: boolean
  children: ReactNode
}

function CollapsibleSection({
  label,
  count,
  accent,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  indent = false,
  children
}: CollapsibleSectionProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : localOpen

  function handleToggle() {
    if (isControlled) onOpenChange?.(!open)
    else setLocalOpen((o) => !o)
  }

  const s = accentStyles[accent]

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 w-full text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-lg ${indent ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      >
        <span className={`text-[10px] font-bold uppercase tracking-wide flex-1 ${s.label}`}>
          {label}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.count}`}>
          {count}
        </span>
        {open ? (
          <ChevronUp size={11} className={s.chevron} />
        ) : (
          <ChevronDown size={11} className={s.chevron} />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

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
          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
            variant === 'overdue'
              ? 'bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
              : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
          }`}
        >
          <div
            className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-blue-500 dark:text-[#6498c8]/80'}`}
          >
            {variant === 'overdue' ? formatOverdueDate(dateStr) : formatUpcomingDate(dateStr)}
          </div>
          <div className="text-[13px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-[#f0f0f0]">
            {title}
          </div>
          {time && (
            <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{time}</div>
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
      <div className="flex items-center px-3 py-2.5 border-b border-black/30 dark:border-black/60 bg-[var(--bg-header)] shrink-0 h-11">
        {leftOpen && (
          <span className="text-[11px] font-semibold text-white/50 flex-1">Schedule</span>
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
              <p className="text-[12px] text-slate-400 dark:text-white/25 px-4 py-6 text-center leading-relaxed">
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
            <Bell size={14} className="text-slate-300 dark:text-white/20" />
          </div>
        )}
      </div>

      {/* Resize handle */}
      {leftOpen && (
        <div
          onMouseDown={onResizeStart}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors"
        />
      )}

      {/* Bottom nav */}
      {leftOpen && (
        <div className="p-3 border-t-2 border-slate-200 dark:border-white/[0.07] shrink-0">
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
