import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { formatWeekRange } from '../../utils/dates'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

interface Props {
  displayDate: Temporal.PlainDate
  view: 'month' | 'week'
  weekDays: Temporal.PlainDate[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: 'month' | 'week') => void
  onMonthSelect?: (month: number) => void
  onYearSelect?: (year: number) => void
  onDateSelect?: (date: Temporal.PlainDate) => void
}

export default function CalendarHeader({
  displayDate,
  view,
  weekDays,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onMonthSelect,
  onYearSelect,
  onDateSelect,
}: Props) {
  const isMonth = view === 'month'
  const isWeek = view === 'week'
  const monthName = isMonth
    ? displayDate.toLocaleString('en-US', { month: 'long' })
    : formatWeekRange(weekDays)
  const yearStr = isMonth ? String(displayDate.year) : ''

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(displayDate.year)
  const [pickerMonth, setPickerMonth] = useState(displayDate.month)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPickerYear(displayDate.year)
    setPickerMonth(displayDate.month)
  }, [displayDate])

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

  const weekDayStrs = isWeek ? new Set(weekDays.map((d) => d.toString())) : null
  const todayStr = Temporal.Now.plainDateISO().toString()
  const calendarGrid = pickerOpen && isWeek ? buildCalendarGrid(pickerYear, pickerMonth) : []

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0 bg-[var(--bg-surface)] gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrev}
            aria-label="Previous"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNext}
            aria-label="Next"
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
              className={[
                'tracking-tight text-slate-900 dark:text-white/80',
                isMonth ? 'text-4xl' : 'text-2xl',
              ].join(' ')}
              style={{ fontFamily: "'Bree Serif', serif" }}
            >
              {monthName}
            </h2>
            {yearStr && (
              <span className="text-xl font-normal text-slate-300 dark:text-white/50 tracking-tight" style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif", fontWeight: 400 }}>
                {yearStr}
              </span>
            )}
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
                  onClick={() => {
                    const y = pickerYear - 1
                    setPickerYear(y)
                    if (isMonth) onYearSelect?.(y)
                  }}
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
                  onClick={() => {
                    const y = pickerYear + 1
                    setPickerYear(y)
                    if (isMonth) onYearSelect?.(y)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Month grid */}
              <div className={`grid grid-cols-3 gap-1${isWeek ? ' mb-3' : ''}`}>
                {MONTHS.map((name, i) => {
                  const month = i + 1
                  const isActive = month === (isMonth ? displayDate.month : pickerMonth) && pickerYear === displayDate.year
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        if (isMonth) {
                          onMonthSelect?.(month)
                          setPickerOpen(false)
                        } else {
                          setPickerMonth(month)
                        }
                      }}
                      className={[
                        'px-2 py-2 text-xs font-medium rounded-lg transition-all',
                        isActive
                          ? 'bg-[var(--accent)] text-white'
                          : isWeek && month === pickerMonth
                            ? 'bg-slate-100 dark:bg-white/[0.1] text-slate-700 dark:text-white/70'
                            : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.08]',
                      ].join(' ')}
                    >
                      {name.slice(0, 3)}
                    </button>
                  )
                })}
              </div>

              {/* Day grid (week view only) */}
              {isWeek && (
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
                      const isInCurrentWeek = weekDayStrs?.has(cellStr) ?? false
                      const isTodayCell = cellStr === todayStr
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onDateSelect?.(cellDate)
                            setPickerOpen(false)
                          }}
                          className={[
                            'w-8 h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center',
                            isInCurrentWeek
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
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 sm:pt-0">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60"
        >
          Today
        </button>
        <div className="flex gap-1">
          {(['month', 'week'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={[
                'px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25',
                view === v
                  ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.12] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.2] shadow-sm'
                  : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60',
              ].join(' ')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
