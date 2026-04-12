import { Temporal } from '@js-temporal/polyfill'
import { isSameDay } from '../../utils/dates'
import ReminderForm from '../reminders/ReminderForm'
import ReminderDetail from '../reminders/ReminderDetail'
import { useWeekView } from './hooks/useWeekView'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number, format: '12h' | '24h'): string {
  if (format === '24h') return `${String(h).padStart(2, '0')}:00`
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

interface Props {
  displayDate: Temporal.PlainDate
}

export default function WeekView({ displayDate }: Props) {
  const {
    scrollRef,
    newForm,
    setNewForm,
    detail,
    setDetail,
    days,
    listCountByDate,
    timedByDate,
    allDayByDate,
    multiDayReminders,
    selectedPlainDate,
    todayStr,
    nowTop,
    hasAllDay,
    hasSingleDayAllDay,
    allDayExpanded,
    setAllDayExpanded,
    maxAllDayCount,
    COLLAPSED_LIMIT,
    timeFormat,
    navigate,
    getColSpan,
    handleDayClick,
    handleSaveNewReminder,
    SLOT_H,
  } = useWeekView({ displayDate })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-auto bg-[var(--bg-app)]">
      <div className="pr-4" style={{ minWidth: 'calc(3.5rem + 7 * 96px)' }}>

        {/* Day header row */}
        <div
          className="sticky top-0 z-20 grid border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
        >
          <div className="sticky left-0 z-10 bg-[var(--bg-app)]" />
          {days.map((day) => {
            const isToday = day.toString() === todayStr
            const isSelected = isSameDay(day, selectedPlainDate)
            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={[
                  'relative flex flex-col items-center py-2 gap-0.5 overflow-hidden transition-colors',
                  isToday
                    ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07] hover:bg-blue-100/60 dark:hover:bg-[#6498c8]/[0.12]'
                    : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[5px] bg-blue-500 dark:bg-[#6498c8]" />}
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 dark:text-white/18">
                  {DAY_NAMES[day.dayOfWeek % 7]}
                </span>
                <span className={[
                  'flex items-center justify-center w-8 h-8 text-[15px] font-bold leading-none',
                  isToday ? 'text-blue-500 dark:text-[#6498c8]'
                    : isSelected ? 'text-slate-900 dark:text-[#f0f0f0]'
                    : 'text-slate-700 dark:text-white/80',
                ].filter(Boolean).join(' ')}>
                  {day.day}
                </span>
              </button>
            )
          })}
        </div>

        {/* All-day strip */}
        {hasAllDay && (
          <div className="border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]">
            {/* Multi-day spanning reminders */}
            {multiDayReminders.length > 0 && (
              <div className="flex py-[3px]">
                <div className="sticky left-0 z-10 bg-[var(--bg-app)]" style={{ width: '3.5rem', flexShrink: 0 }} />
                <div className="flex-1 relative" style={{ height: allDayExpanded ? '30px' : '22px' }}>
                  {multiDayReminders.map((r) => {
                    const { startCol, endCol } = getColSpan(r)
                    return (
                      <button
                        key={r.id}
                        onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr: r.date }) }}
                        className={[
                          'absolute top-0 h-full px-1.5 rounded-md font-semibold truncate bg-[#6498c8]/[0.18] text-[#6498c8] border border-[#6498c8]/[0.15] border-b-[2.5px] border-b-[#6498c8]/[0.35] transition-all duration-200 hover:bg-[#6498c8]/[0.32] hover:brightness-125 hover:shadow-md active:translate-y-[1.5px]',
                          allDayExpanded ? 'text-[11px]' : 'text-[10px]',
                        ].join(' ')}
                        style={{
                          left: `calc(${startCol} * 100% / 7)`,
                          width: `calc(${endCol - startCol + 1} * 100% / 7 - 4px)`,
                        }}
                      >
                        {r.title}
                        {allDayExpanded && r.description && (
                          <span className="ml-1.5 font-normal opacity-60">{r.description}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Single-day all-day reminders */}
            {hasSingleDayAllDay && (
              <div
                className="grid"
                style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
              >
                <div className="sticky left-0 z-10 flex items-center justify-end pr-2 py-1 bg-[var(--bg-app)]">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-slate-300 dark:text-white/50">all‑day</span>
                </div>
                {days.map((day) => {
                  const dateStr = day.toString()
                  const dayReminders = allDayByDate[dateStr] ?? []
                  const dayListCount = listCountByDate[dateStr] ?? 0
                  const isOverdue = dateStr < todayStr
                  const listBadge = isOverdue
                    ? 'bg-[#e8a045]/[0.12] text-[#e8a045] border border-[#e8a045]/[0.12] border-b-[2.5px] border-b-[#e8a045]/[0.30] hover:bg-[#e8a045]/[0.28]'
                    : 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 border border-emerald-500/[0.12] border-b-[2.5px] border-b-emerald-500/[0.30] hover:bg-emerald-500/[0.28]'
                  const totalItems = dayReminders.length + (dayListCount > 0 ? 1 : 0)
                  const visibleReminders = allDayExpanded ? dayReminders : dayReminders.slice(0, COLLAPSED_LIMIT)
                  const hiddenCount = allDayExpanded ? 0 : totalItems - COLLAPSED_LIMIT
                  return (
                    <div key={dateStr} className={['flex flex-col gap-[2px] px-1 py-1 min-h-[28px] overflow-hidden min-w-0 transition-all duration-200', dateStr === todayStr ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07]' : ''].join(' ')}>
                      {visibleReminders.map((r) => (
                        <button
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr }) }}
                          className={[
                            'w-full text-left px-1.5 rounded-md bg-[#6498c8]/[0.12] text-[#6498c8] border border-[#6498c8]/[0.12] border-b-[2.5px] border-b-[#6498c8]/[0.30] transition-all duration-200 hover:bg-[#6498c8]/[0.28] hover:brightness-125 hover:shadow-md hover:scale-[1.03] active:translate-y-[1.5px]',
                            allDayExpanded ? 'py-1' : 'py-[2px]',
                          ].join(' ')}
                        >
                          <span className={[
                            'block truncate font-semibold',
                            allDayExpanded ? 'text-[11px]' : 'text-[10px]',
                          ].join(' ')}>
                            {r.title}
                          </span>
                          {allDayExpanded && r.description && (
                            <span className="block truncate text-[9px] font-normal opacity-60 mt-[1px]">
                              {r.description}
                            </span>
                          )}
                        </button>
                      ))}
                      {(allDayExpanded || hiddenCount <= 0) && dayListCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/day/${dateStr}`, { state: { tab: 'todos' } }) }}
                          className={[
                            'w-full text-left px-1.5 rounded-md font-semibold truncate transition-all duration-200 hover:brightness-125 hover:shadow-md hover:scale-[1.03] active:translate-y-[1.5px]',
                            allDayExpanded ? 'py-1 text-[11px]' : 'py-[2px] text-[10px]',
                            listBadge,
                          ].join(' ')}
                        >
                          ☐ {dayListCount} {dayListCount === 1 ? 'list' : 'lists'}
                        </button>
                      )}
                      {!allDayExpanded && hiddenCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setAllDayExpanded(true) }}
                          className="w-full text-center text-[9px] font-semibold text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/50 transition-colors py-[1px]"
                        >
                          +{hiddenCount} more
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {/* Expand/collapse toggle */}
            {maxAllDayCount > COLLAPSED_LIMIT && (
              <button
                onClick={() => setAllDayExpanded(!allDayExpanded)}
                className="w-full flex items-center justify-center gap-1 py-[2px] text-[9px] font-semibold text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/50 transition-colors"
              >
                <svg
                  className={['w-3 h-3 transition-transform duration-200', allDayExpanded ? 'rotate-180' : ''].join(' ')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {allDayExpanded ? 'collapse' : 'expand'}
              </button>
            )}
          </div>
        )}

        {/* Time grid */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)', minHeight: `${SLOT_H * 24}px` }}
        >
          {days.some((d) => d.toString() === todayStr) && (
            <div className="absolute left-0 right-0 z-[5] pointer-events-none" style={{ top: `${nowTop}px` }}>
              <div className="absolute left-14 right-0 flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-blue-500" />
              </div>
            </div>
          )}

          {HOURS.map((hour) => (
            <>
              <div
                key={`label-${hour}`}
                className="sticky left-0 z-10 flex items-start justify-end pr-2 pt-1 bg-[var(--bg-app)]"
                style={{ height: `${SLOT_H}px` }}
              >
                {hour !== 0 && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-white/60 -translate-y-[0.45em]">
                    {formatHour(hour, timeFormat)}
                  </span>
                )}
              </div>
              {days.map((day) => {
                const dateStr = day.toString()
                const isToday = dateStr === todayStr
                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={[
                      'border-t border-l border-slate-300/70 dark:border-white/[0.10] min-w-0 cursor-pointer',
                      'opacity-80 hover:opacity-100 hover:brightness-105 transition-all duration-150',
                      isToday ? 'bg-blue-50/60 dark:bg-[#6498c8]/[0.07]' : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]',
                    ].filter(Boolean).join(' ')}
                    style={{ height: `${SLOT_H}px` }}
                    onClick={() => setNewForm({ date: dateStr, time: `${String(hour).padStart(2, '0')}:00` })}
                  />
                )
              })}
            </>
          ))}

          {/* Timed reminder overlays — one absolute column per day */}
          {days.map((day, dayIndex) => {
            const dateStr = day.toString()
            const dayReminders = timedByDate[dateStr] ?? []
            if (dayReminders.length === 0) return null
            return (
              <div
                key={`overlay-${dateStr}`}
                className="absolute top-0 pointer-events-none"
                style={{
                  left: `calc(3.5rem + ${dayIndex} * (100% - 3.5rem) / 7)`,
                  width: `calc((100% - 3.5rem) / 7)`,
                  height: `${SLOT_H * 24}px`,
                }}
              >
                {dayReminders.map((r) => {
                  const [sh, sm] = r.startTime!.split(':').map(Number)
                  const top = (sh + sm / 60) * SLOT_H
                  let height: number
                  if (r.endTime) {
                    const [eh, em] = r.endTime.split(':').map(Number)
                    height = Math.max(20, ((eh + em / 60) - (sh + sm / 60)) * SLOT_H)
                  } else {
                    height = SLOT_H - 8
                  }
                  return (
                    <button
                      key={r.id}
                      onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr }) }}
                      className="absolute left-1 right-1 px-1.5 py-[3px] rounded-md text-[11px] font-semibold bg-[#6498c8]/[0.15] text-[#6498c8] border border-[#6498c8]/[0.12] border-b-[2.5px] border-b-[#6498c8]/[0.32] transition-all duration-150 hover:bg-[#6498c8]/[0.28] hover:brightness-125 hover:shadow-md active:translate-y-[1.5px] pointer-events-auto overflow-hidden"
                      style={{ top, height }}
                    >
                      <span className="block truncate">{r.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      </div>

      {newForm && (
        <ReminderForm
          date={newForm.date}
          reminder={null}
          defaultTime={newForm.time}
          onSave={handleSaveNewReminder}
          onClose={() => setNewForm(null)}
        />
      )}

      {detail && (
        <ReminderDetail
          reminder={detail.reminder}
          dateStr={detail.dateStr}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
