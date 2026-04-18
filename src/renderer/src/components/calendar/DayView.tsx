import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { useDayView } from '../hooks/useDayView'
import DayViewNotesTab from './DayViewNotesTab'
import DayViewRemindersTab from './DayViewRemindersTab'
import DayViewTodosTab from './DayViewTodosTab'
import { useUIStore } from '../../store/ui.store'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const SETTLE_MS = 200
const SWIPE_THRESHOLD = 50

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return {
      label: 'Today',
      cls: 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)]',
    }
  if (cmp < 0)
    return {
      label: 'Past',
      cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/55 border border-slate-200 dark:border-white/10',
    }
  return null
}

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Temporal.PlainDate(year, month, 1)
  const daysInMonth = firstDay.daysInMonth
  const startDow = firstDay.dayOfWeek % 7 // 0=Sun
  const grid: (number | null)[] = []
  for (let i = 0; i < startDow; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

/** Lightweight panel shown for adjacent (prev/next) days during slide animation.
 *  Only shows the tab bar — the header is fixed above the strip and not duplicated. */
function AdjacentDayPanel({ activeTab }: { activeTab: string }) {
  return (
    <div className="shrink-0 w-[calc(100%/3)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-7 w-full">
        <div className="flex items-center gap-1 border-b border-slate-200/60 dark:border-white/[0.07] mb-6">
          {(['notes', 'reminders', 'todos'] as const).map((id) => (
            <span
              key={id}
              className={`relative px-4 py-2.5 text-[13px] font-medium capitalize ${
                activeTab === id
                  ? 'text-slate-900 dark:text-[#f0f0f0]'
                  : 'text-slate-400 dark:text-white/55'
              }`}
            >
              {id}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-t-full" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DayView() {
  const {
    dateStr,
    plainDate,
    tab,
    setTab,
    expandedReminderId,
    setExpandedReminderId,
    editingNoteId,
    setEditingNoteId,
    editingItemId,
    setEditingItemId,
    editingListTitleId,
    setEditingListTitleId,
    expandedListIds,
    notes,
    saveNote,
    items,
    reorderItems,
    dayReminders,
    overdueReminders,
    upcomingReminders,
    dayLists,
    timeFormat,
    toggleComplete,
    save,
    handleToggleItem,
    handleAddItem,
    handleSaveEdit,
    handleSaveDesc,
    handleCancelEdit,
    toggleListExpanded,
    handleCreateInlineList,
    handleSaveListTitle,
    handleAddReminder,
    handleCancelReminder,
    handleNewNote,
    handleDeleteNote,
    handleDeleteReminder,
    handleDeleteList,
    handleDeleteItem,
    reminderDelete,
    noteDelete,
    listDelete,
    itemDelete,
    navigate,
  } = useDayView()

  const { weekday, rest } = formatDayHeading(plainDate)
  const status = getDayStatus(plainDate)

  const setView = useUIStore((s) => s.setView)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(plainDate.year)
  const [pickerMonth, setPickerMonth] = useState(plainDate.month)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPickerYear(plainDate.year)
    setPickerMonth(plainDate.month)
  }, [plainDate])

  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  const handleViewSwitch = (v: 'month' | 'week') => {
    setView(v)
    navigate('/')
  }

  const isToday = dateStr === Temporal.Now.plainDateISO().toString()

  /* ── 3-panel strip animation (same pattern as MonthView) ── */
  const stripRef = useRef<HTMLDivElement>(null)
  const animatingRef = useRef(false)
  const touchRef = useRef<{
    startX: number
    startY: number
    dx: number
    locked: boolean | null
  } | null>(null)

  const goToDate = useCallback((d: Temporal.PlainDate) => {
    const s = d.toString()
    setSelectedDate(s)
    navigate(`/day/${s}`)
  }, [setSelectedDate, navigate])

  const setStripPx = useCallback((px: number, transition?: string) => {
    const el = stripRef.current
    if (!el) return
    el.style.transition = transition ?? 'none'
    el.style.transform = `translateX(calc(-33.333% + ${px}px))`
  }, [])

  const animateSlide = useCallback(
    (direction: 'left' | 'right', onDone: () => void) => {
      if (animatingRef.current) return
      animatingRef.current = true
      const viewW = stripRef.current?.parentElement?.offsetWidth ?? 400
      const targetPx = direction === 'left' ? -viewW : viewW
      setStripPx(targetPx, `transform ${SETTLE_MS}ms ease-out`)
      setTimeout(onDone, SETTLE_MS)
    },
    [setStripPx]
  )

  const handlePrevDay = useCallback(() => {
    animateSlide('right', () => goToDate(plainDate.subtract({ days: 1 })))
  }, [animateSlide, goToDate, plainDate])

  const handleNextDay = useCallback(() => {
    animateSlide('left', () => goToDate(plainDate.add({ days: 1 })))
  }, [animateSlide, goToDate, plainDate])

  const handleToday = () => {
    const target = Temporal.Now.plainDateISO()
    const cmp = Temporal.PlainDate.compare(plainDate, target)
    if (cmp === 0) return
    const dir = cmp > 0 ? 'right' : 'left'
    animateSlide(dir, () => goToDate(target))
  }

  const handlePickerDateSelect = useCallback((cellDate: Temporal.PlainDate) => {
    setPickerOpen(false)
    const cmp = Temporal.PlainDate.compare(plainDate, cellDate)
    if (cmp === 0) return
    const dir = cmp > 0 ? 'right' : 'left'
    animateSlide(dir, () => goToDate(cellDate))
  }, [plainDate, animateSlide, goToDate])

  // Reset strip to center before browser paints the new content
  useLayoutEffect(() => {
    const el = stripRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = 'translateX(-33.333%)'
    animatingRef.current = false
  }, [dateStr])

  /* ── Touch swipe ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (animatingRef.current) return
    const t = e.touches[0]
    touchRef.current = { startX: t.clientX, startY: t.clientY, dx: 0, locked: null }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = touchRef.current
    if (!touch || animatingRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - touch.startX
    const dy = t.clientY - touch.startY
    if (touch.locked === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touch.locked = Math.abs(dx) > Math.abs(dy)
      }
      if (!touch.locked) return
    }
    if (!touch.locked) return
    touch.dx = dx
    setStripPx(dx)
  }, [setStripPx])

  const handleTouchEnd = useCallback(() => {
    const touch = touchRef.current
    if (!touch || animatingRef.current) {
      touchRef.current = null
      return
    }
    const dx = touch.dx
    touchRef.current = null

    if (!touch.locked || Math.abs(dx) <= SWIPE_THRESHOLD) {
      setStripPx(0, `transform ${SETTLE_MS}ms ease-out`)
      return
    }

    if (dx > 0) {
      handlePrevDay()
    } else {
      handleNextDay()
    }
  }, [setStripPx, handlePrevDay, handleNextDay])

  /* ── Scroll wheel ── */
  const wheelAccum = useRef(0)
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (animatingRef.current) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      wheelAccum.current += delta

      const nudge = Math.sign(wheelAccum.current) * Math.min(Math.abs(wheelAccum.current) * 0.15, 60)
      setStripPx(-nudge)

      if (wheelTimer.current) clearTimeout(wheelTimer.current)

      if (Math.abs(wheelAccum.current) > 80) {
        const dir: 'left' | 'right' = wheelAccum.current > 0 ? 'left' : 'right'
        wheelAccum.current = 0
        if (dir === 'left') handleNextDay()
        else handlePrevDay()
      } else {
        wheelTimer.current = setTimeout(() => {
          wheelAccum.current = 0
          setStripPx(0, `transform 150ms ease-out`)
        }, 200)
      }
    },
    [setStripPx, handleNextDay, handlePrevDay]
  )

  const calendarGrid = pickerOpen ? buildCalendarGrid(pickerYear, pickerMonth) : []
  const todayStr = Temporal.Now.plainDateISO().toString()

  return (
    <div className="flex flex-col h-full">
      {/* Header — stays fixed, does not slide */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0 bg-[var(--bg-surface)] gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextDay}
              aria-label="Next day"
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-baseline gap-2.5 leading-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h2
                className="text-3xl tracking-tight text-slate-900 dark:text-white/80"
                style={{ fontFamily: "'Bree Serif', serif" }}
              >
                {weekday}
              </h2>
              <span
                className="text-xl font-normal text-slate-300 dark:text-white/50 tracking-tight"
                style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif", fontWeight: 400 }}
              >
                {rest}
              </span>
              <ChevronDown
                size={18}
                className={[
                  'text-slate-300 dark:text-white/40 transition-transform self-center',
                  pickerOpen ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>

            {pickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-lg p-4 w-[280px]">
                {/* Year selector */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span
                    className="text-sm font-semibold text-slate-700 dark:text-white/80"
                    style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif" }}
                  >
                    {pickerYear}
                  </span>
                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {MONTHS.map((name, i) => {
                    const month = i + 1
                    const isActive = month === pickerMonth && pickerYear === plainDate.year
                    return (
                      <button
                        key={name}
                        onClick={() => setPickerMonth(month)}
                        className={[
                          'px-2 py-2 text-xs font-medium rounded-lg transition-all',
                          isActive
                            ? 'bg-[var(--accent)] text-white'
                            : month === pickerMonth
                              ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-700 dark:text-white/70'
                              : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.08]',
                        ].join(' ')}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>

                {/* Day grid */}
                <div className="border-t border-slate-200 dark:border-white/[0.07] pt-3">
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <span key={d} className="text-[10px] font-medium text-slate-400 dark:text-white/40 text-center">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarGrid.map((day, idx) => {
                      if (day === null) return <span key={idx} />
                      const cellDate = new Temporal.PlainDate(pickerYear, pickerMonth, day)
                      const cellStr = cellDate.toString()
                      const isSelected = cellStr === dateStr
                      const isTodayCell = cellStr === todayStr
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePickerDateSelect(cellDate)}
                          className={[
                            'w-8 h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center',
                            isSelected
                              ? 'bg-[var(--accent)] text-white'
                              : isTodayCell
                                ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-bold'
                                : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.08]',
                          ].join(' ')}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <button
            onClick={handleToday}
            className={[
              'px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25',
              isToday
                ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.12] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.2] shadow-sm'
                : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60',
            ].join(' ')}
          >
            Today
          </button>
          <div className="flex gap-1">
            {(['month', 'week'] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleViewSwitch(v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area — 3-panel sliding strip */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          ref={stripRef}
          style={{
            display: 'flex',
            width: '300%',
            height: '100%',
            transform: 'translateX(-33.333%)',
            willChange: 'transform',
          }}
        >
          {/* Previous day */}
          <AdjacentDayPanel activeTab={tab} />

          {/* Current day */}
          <div className="shrink-0 w-[calc(100%/3)] overflow-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-7 w-full">

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200/60 dark:border-white/[0.07] mb-6">
                {(
                  [
                    { id: 'notes', label: 'Notes', count: null },
                    {
                      id: 'reminders',
                      label: 'Reminders',
                      count: dayReminders.length,
                      overdue: overdueReminders.length,
                      upcoming: upcomingReminders.length,
                    },
                    { id: 'todos', label: 'Todos', count: dayLists.length },
                  ] as const
                ).map(({ id, label, count, ...tabRest }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                      tab === id
                        ? 'text-slate-900 dark:text-[#f0f0f0]'
                        : 'text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/60'
                    }`}
                  >
                    {label}
                    {id === 'reminders' ? (
                      <>
                        {'overdue' in tabRest && tabRest.overdue > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8a045]/[0.15] text-[#e8a045]">
                            {tabRest.overdue}
                          </span>
                        )}
                        {'upcoming' in tabRest && tabRest.upcoming > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-upcoming-muted)] text-[var(--color-upcoming)]">
                            {tabRest.upcoming}
                          </span>
                        )}
                      </>
                    ) : (
                      count !== null &&
                      count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-upcoming-muted)] text-[var(--color-upcoming)]">
                          {count}
                        </span>
                      )
                    )}
                    {tab === id && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'notes' && (
                <DayViewNotesTab
                  dateStr={dateStr}
                  notes={notes}
                  editingNoteId={editingNoteId}
                  setEditingNoteId={setEditingNoteId}
                  saveNote={saveNote}
                  handleNewNote={handleNewNote}
                  handleDeleteNote={handleDeleteNote}
                />
              )}

              {tab === 'reminders' && (
                <DayViewRemindersTab
                  dateStr={dateStr}
                  dayReminders={dayReminders}
                  expandedReminderId={expandedReminderId}
                  setExpandedReminderId={setExpandedReminderId}
                  timeFormat={timeFormat}
                  toggleComplete={toggleComplete}
                  save={save}
                  handleAddReminder={handleAddReminder}
                  handleCancelReminder={handleCancelReminder}
                  handleDeleteReminder={handleDeleteReminder}
                />
              )}

              {tab === 'todos' && (
                <DayViewTodosTab
                  dayLists={dayLists}
                  items={items}
                  expandedListIds={expandedListIds}
                  editingListTitleId={editingListTitleId}
                  setEditingListTitleId={setEditingListTitleId}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                  toggleListExpanded={toggleListExpanded}
                  handleToggleItem={handleToggleItem}
                  handleAddItem={handleAddItem}
                  handleSaveEdit={handleSaveEdit}
                  handleSaveDesc={handleSaveDesc}
                  handleCancelEdit={handleCancelEdit}
                  handleDeleteItem={handleDeleteItem}
                  handleDeleteList={handleDeleteList}
                  handleCreateInlineList={handleCreateInlineList}
                  handleSaveListTitle={handleSaveListTitle}
                  reorderItems={reorderItems}
                />
              )}

              {reminderDelete.pendingId && (
                <ConfirmDeleteDialog
                  message={reminderDelete.pendingMessage}
                  anchorRect={reminderDelete.anchorRect}
                  onConfirm={reminderDelete.confirmDelete}
                  onCancel={reminderDelete.cancelDelete}
                />
              )}
              {noteDelete.pendingId && (
                <ConfirmDeleteDialog
                  message={noteDelete.pendingMessage}
                  anchorRect={noteDelete.anchorRect}
                  onConfirm={noteDelete.confirmDelete}
                  onCancel={noteDelete.cancelDelete}
                />
              )}
              {listDelete.pendingId && (
                <ConfirmDeleteDialog
                  message={listDelete.pendingMessage}
                  anchorRect={listDelete.anchorRect}
                  onConfirm={listDelete.confirmDelete}
                  onCancel={listDelete.cancelDelete}
                />
              )}
              {itemDelete.pendingId && (
                <ConfirmDeleteDialog
                  message={itemDelete.pendingMessage}
                  anchorRect={itemDelete.anchorRect}
                  onConfirm={itemDelete.confirmDelete}
                  onCancel={itemDelete.cancelDelete}
                />
              )}
            </div>
          </div>

          {/* Next day */}
          <AdjacentDayPanel activeTab={tab} />
        </div>
      </div>
    </div>
  )
}
