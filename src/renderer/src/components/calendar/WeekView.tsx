import { useRef, useLayoutEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { flushSync } from 'react-dom'
import { isSameDay } from '../../utils/dates'
import ReminderCard from '../reminders/ReminderCard'
import { useWeekView } from './hooks/useWeekView'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SETTLE_MS = 200

function formatHour(h: number, format: '12h' | '24h'): string {
  if (format === '24h') return `${String(h).padStart(2, '0')}:00`
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export interface WeekViewHandle {
  animateToWeek: (direction: 'left' | 'right') => void
  animateToDate: (target: Temporal.PlainDate) => void
}

interface Props {
  displayDate: Temporal.PlainDate
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onNavigate?: (date: Temporal.PlainDate) => void
}

const WeekView = forwardRef<WeekViewHandle, Props>(function WeekView({ displayDate, onSwipeLeft, onSwipeRight, onNavigate }, ref) {
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
    saveReminder,
    removeReminder,
    SLOT_H,
  } = useWeekView({ displayDate })

  /* ── Two-phase slide animation ── */
  const contentRef = useRef<HTMLDivElement>(null)
  const prevDateRef = useRef(displayDate.toString())
  const directionRef = useRef<'left' | 'right' | null>(null)
  const animatingRef = useRef(false)

  const triggerSlideOut = useCallback(
    (dir: 'left' | 'right', onDone: () => void) => {
      if (animatingRef.current) return
      const el = contentRef.current
      if (!el) { onDone(); return }

      animatingRef.current = true
      directionRef.current = dir

      const exitX = dir === 'left' ? '-100%' : '100%'
      el.style.transition = `transform ${SETTLE_MS}ms ease-in, opacity ${SETTLE_MS}ms ease-in`
      el.style.transform = `translateX(${exitX})`
      el.style.opacity = '0'

      setTimeout(() => flushSync(onDone), SETTLE_MS)
    },
    []
  )

  // Phase 2: after displayDate changes, slide new content IN
  // animatingRef stays true until slide-in finishes, blocking new swipe gestures
  useLayoutEffect(() => {
    const cur = displayDate.toString()
    if (prevDateRef.current !== cur && directionRef.current && contentRef.current) {
      const dir = directionRef.current
      const enterX = dir === 'left' ? '100%' : '-100%'
      const el = contentRef.current
      // Reset horizontal scroll so the new week starts at the first day
      if (scrollRef.current) scrollRef.current.scrollLeft = 0
      el.style.transition = 'none'
      el.style.transform = `translateX(${enterX})`
      el.style.opacity = '0'
      void el.offsetHeight // force reflow
      el.style.transition = `transform ${SETTLE_MS}ms ease-out, opacity ${SETTLE_MS}ms ease-out`
      el.style.transform = 'translateX(0)'
      el.style.opacity = '1'
      directionRef.current = null
      // Keep animatingRef true during slide-in + cooldown to prevent immediate re-swipe
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = ''
          contentRef.current.style.transform = ''
          contentRef.current.style.opacity = ''
        }
        // Extra cooldown so layout settles and scrollWidth is accurate
        setTimeout(() => { animatingRef.current = false }, 100)
      }, SETTLE_MS)
    }
    prevDateRef.current = cur
  }, [displayDate])

  const animateToWeek = useCallback(
    (direction: 'left' | 'right') => {
      const nav = direction === 'left' ? onSwipeLeft : onSwipeRight
      triggerSlideOut(direction, () => nav?.())
    },
    [onSwipeLeft, onSwipeRight, triggerSlideOut]
  )

  const animateToDate = useCallback(
    (target: Temporal.PlainDate) => {
      const cmp = Temporal.PlainDate.compare(displayDate, target)
      if (cmp === 0) return
      const direction = cmp > 0 ? 'right' : 'left'
      triggerSlideOut(direction, () => onNavigate?.(target))
    },
    [displayDate, onNavigate, triggerSlideOut]
  )

  useImperativeHandle(ref, () => ({ animateToWeek, animateToDate }), [animateToWeek, animateToDate])

  /* ── Touch swipe (only at horizontal scroll edges) ── */
  const SWIPE_THRESHOLD = 50
  const touchRef = useRef<{
    startX: number
    startY: number
    dx: number
    locked: boolean | null
  } | null>(null)

  const isAtEdge = useCallback((direction: 'left' | 'right'): boolean => {
    const el = scrollRef.current
    if (!el) return false
    const maxScroll = el.scrollWidth - el.clientWidth
    // No horizontal overflow — don't enable swipe nav, let normal touch behavior handle it
    if (maxScroll <= 2) return false
    if (direction === 'right') return el.scrollLeft <= 2
    return el.scrollLeft >= maxScroll - 2
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (animatingRef.current) return
    const t = e.touches[0]
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      dx: 0,
      locked: null,
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current
    if (!touch || animatingRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - touch.startX
    const dy = t.clientY - touch.startY

    // Once decided, don't re-evaluate
    if (touch.locked === false) return

    if (touch.locked === null) {
      // Need enough movement to decide
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return

      // Only consider horizontal gestures
      if (Math.abs(dy) >= Math.abs(dx)) {
        touch.locked = false
        return
      }

      // Check if at the correct edge RIGHT NOW (after browser has had a chance to scroll)
      const swipeDir: 'left' | 'right' = dx > 0 ? 'right' : 'left'
      if (!isAtEdge(swipeDir)) {
        touch.locked = false
        return
      }

      touch.locked = true
    }

    e.preventDefault()
    touch.dx = dx
    const el = contentRef.current
    if (el) {
      el.style.transition = 'none'
      el.style.transform = `translateX(${dx * 0.4}px)`
      el.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 400))
    }
  }, [isAtEdge])

  const handleTouchEnd = useCallback(() => {
    const touch = touchRef.current
    if (!touch || animatingRef.current) {
      touchRef.current = null
      return
    }
    const dx = touch.dx
    touchRef.current = null

    if (!touch.locked || Math.abs(dx) <= SWIPE_THRESHOLD) {
      const el = contentRef.current
      if (el) {
        el.style.transition = `transform ${SETTLE_MS}ms ease-out, opacity ${SETTLE_MS}ms ease-out`
        el.style.transform = 'translateX(0)'
        el.style.opacity = '1'
      }
      return
    }

    const dir: 'left' | 'right' = dx < 0 ? 'left' : 'right'
    const nav = dx < 0 ? onSwipeLeft : onSwipeRight
    triggerSlideOut(dir, () => nav?.())
  }, [onSwipeLeft, onSwipeRight, triggerSlideOut])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-[var(--bg-app)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <div ref={contentRef} className="pr-4" style={{ minWidth: 'calc(3.5rem + 7 * 96px)' }}>

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
                    ? 'bg-[var(--accent-muted)] hover:brightness-110'
                    : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[5px] bg-[var(--accent)]" />}
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 dark:text-white/18">
                  {DAY_NAMES[day.dayOfWeek % 7]}
                </span>
                <span className={[
                  'flex items-center justify-center w-8 h-8 text-[15px] font-bold leading-none',
                  isToday ? 'text-[var(--accent)]'
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
                          'absolute top-0 h-full px-1.5 rounded-md font-semibold truncate bg-[var(--color-upcoming)]/[0.18] text-[var(--color-upcoming)] border border-[var(--color-upcoming)]/[0.15] border-b-[2.5px] border-b-[var(--color-upcoming)]/[0.35] transition-all duration-200 hover:bg-[var(--color-upcoming)]/[0.32] hover:brightness-125 hover:shadow-md active:translate-y-[1.5px]',
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
                    <div key={dateStr} className={['flex flex-col gap-[2px] px-1 py-1 min-h-[28px] overflow-hidden min-w-0 transition-all duration-200', dateStr === todayStr ? 'bg-[var(--accent-muted)]' : ''].join(' ')}>
                      {visibleReminders.map((r) => (
                        <button
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); setDetail({ reminder: r, dateStr }) }}
                          className={[
                            'w-full text-left px-1.5 rounded-md bg-[var(--color-upcoming)]/[0.12] text-[var(--color-upcoming)] border border-[var(--color-upcoming)]/[0.12] border-b-[2.5px] border-b-[var(--color-upcoming)]/[0.30] transition-all duration-200 hover:bg-[var(--color-upcoming)]/[0.28] hover:brightness-125 hover:shadow-md hover:scale-[1.03] active:translate-y-[1.5px]',
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
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-[var(--accent)]" />
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
                      'relative border-t border-l border-slate-300/70 dark:border-white/[0.10] min-w-0 cursor-pointer',
                      'opacity-80 hover:opacity-100 hover:brightness-105 transition-all duration-150',
                      isToday
                        ? 'bg-[var(--accent-muted)]'
                        : hour % 2 === 0
                          ? 'bg-black/[0.025] dark:bg-white/[0.018] hover:bg-black/[0.04] dark:hover:bg-white/[0.035]'
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]',
                    ].filter(Boolean).join(' ')}
                    style={{ height: `${SLOT_H}px` }}
                    onClick={() => {
                      const now = new Date().toISOString()
                      setNewForm({ id: crypto.randomUUID(), title: '', date: dateStr, startTime: `${String(hour).padStart(2, '0')}:00`, completedDates: [], createdAt: now, updatedAt: now })
                    }}
                  >
                    <div
                      className="absolute top-1/2 left-0 right-0 h-px pointer-events-none text-slate-300 dark:text-white/[0.14]"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 5px, transparent 5px, transparent 12px)' }}
                    />
                  </div>
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
                      className="absolute left-1 right-1 px-1.5 py-[3px] rounded-md text-[11px] font-semibold bg-[var(--color-upcoming)]/[0.15] text-[var(--color-upcoming)] border border-[var(--color-upcoming)]/[0.12] border-b-[2.5px] border-b-[var(--color-upcoming)]/[0.32] transition-all duration-150 hover:bg-[var(--color-upcoming)]/[0.28] hover:brightness-125 hover:shadow-md active:translate-y-[1.5px] pointer-events-auto overflow-hidden"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setNewForm(null)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
            <ReminderCard
              reminder={newForm}
              dateStr={newForm.date}
              isExpanded={true}
              onToggleExpand={() => setNewForm(null)}
              timeFormat={timeFormat}
              inModal={true}
              isNew={true}
              onSave={async (r) => { await saveReminder(r); setNewForm(null) }}
              onCancel={() => setNewForm(null)}
              onDelete={() => setNewForm(null)}
            />
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
            <ReminderCard
              reminder={detail.reminder}
              dateStr={detail.dateStr}
              isExpanded={true}
              onToggleExpand={() => setDetail(null)}
              timeFormat={timeFormat}
              inModal={true}
              onSave={async (r) => { await saveReminder(r); setDetail(null) }}
              onCancel={() => setDetail(null)}
              onDelete={(e) => { e.stopPropagation(); removeReminder(detail.reminder.id); setDetail(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default WeekView
