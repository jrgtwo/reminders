import { useRef, useMemo, useLayoutEffect } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { Bell, Clock, Repeat, FileText, CheckSquare } from 'lucide-react'
import { formatDayNum, isToday, isSameMonth } from '../../utils/dates'
import type { Reminder, Todo } from '../../types/models'

function getEventColor(date: Temporal.PlainDate): { dot: string; text: string; chip: string } {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp < 0)
    return {
      dot: 'bg-[#e8a045]',
      text: 'text-red-600 dark:text-[#e8a045]',
      chip: 'bg-red-50 text-red-700 dark:bg-[#e8a045]/[0.08] dark:text-[#e8a045]',
    }
  if (cmp === 0)
    return {
      dot: 'bg-[#e8a045]',
      text: 'text-amber-700 dark:text-[#e8a045]',
      chip: 'bg-amber-50 text-amber-800 dark:bg-[#e8a045]/[0.07] dark:text-[#e8a045]',
    }
  return {
    dot: 'bg-[#6498c8]',
    text: 'text-indigo-600 dark:text-[#6498c8]',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-[#6498c8]/[0.08] dark:text-[#6498c8]',
  }
}

interface Props {
  date: Temporal.PlainDate
  displayMonth: Temporal.PlainDate
  reminders: Reminder[]
  todos?: Todo[]
  hasNote?: boolean
  isSelected: boolean
  isWeekend?: boolean
  mouseClientX: number
  mouseClientY: number
  mouseActive: boolean
  onClick: () => void
  onReminderClick?: () => void
  onNoteClick?: () => void
  onTodoClick?: () => void
  tall?: boolean
}

export default function CalendarDay({
  date,
  displayMonth,
  reminders,
  todos = [],
  hasNote,
  isSelected,
  isWeekend,
  mouseClientX,
  mouseClientY,
  mouseActive,
  onClick,
  onReminderClick,
  onNoteClick,
  onTodoClick,
  tall,
}: Props) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)
  const colors = getEventColor(date)

  const tileRef = useRef<HTMLButtonElement>(null)
  const rectRef = useRef<DOMRect | null>(null)

  useLayoutEffect(() => {
    const update = () => {
      if (tileRef.current) rectRef.current = tileRef.current.getBoundingClientRect()
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const tilt = useMemo(() => {
    if (!mouseActive || !rectRef.current) return { rx: 0, ry: 0 }
    const r = rectRef.current
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = mouseClientX - cx
    const dy = mouseClientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 300
    if (dist > maxDist) return { rx: 0, ry: 0 }
    const influence = 1 - dist / maxDist
    return {
      rx: (dy / (r.height / 2)) * -7 * influence,
      ry: (dx / (r.width / 2)) * 5 * influence,
    }
  }, [mouseActive, mouseClientX, mouseClientY])

  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  const todoChip = cmp < 0
    ? 'bg-[#e8a045]/[0.12] text-[#e8a045] dark:bg-[#e8a045]/[0.10] dark:text-[#e8a045]'
    : 'bg-emerald-500/[0.12] text-emerald-600 dark:bg-emerald-500/[0.08] dark:text-emerald-400'

  let bg: string
  if (todayDate) {
    bg = 'bg-blue-50 dark:bg-[#6498c8]/[0.15]'
  } else if (isSelected) {
    bg = 'bg-white dark:bg-white/[0.10]'
  } else if (!inMonth) {
    bg = 'bg-slate-50 dark:bg-white/[0.03]'
  } else {
    bg = 'bg-white dark:bg-white/[0.07]'
  }

  return (
    <button
      ref={tileRef}
      onClick={onClick}
      style={{ transform: `perspective(500px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      className={[
        'relative flex flex-col items-start w-full text-left cursor-pointer rounded-lg overflow-hidden',
        'transition-[opacity,box-shadow,filter] duration-200',
        'border border-white/50 dark:border-white/[0.10]',
        isSelected ? 'z-[10] opacity-100 brightness-110' : 'z-[2] opacity-80 hover:z-[10] hover:opacity-100 hover:brightness-110',
        tall ? 'p-3.5 gap-2' : 'p-1.5 gap-1 md:p-2 md:gap-1.5 lg:p-2.5 lg:gap-2',
        bg,
        isSelected
          ? 'shadow-[0_4px_0_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_0_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.2)] outline outline-1 outline-slate-300/60 dark:outline-white/[0.1]'
          : 'shadow-[0_3px_0_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_3px_0_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_0_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_0_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.2)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Today stripe */}
      {todayDate && (
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-blue-500 dark:bg-[#6498c8] rounded-t-lg" />
      )}

      {/* Date number */}
      <span
        className={[
          'flex items-center justify-center rounded-full shrink-0 leading-none',
          tall ? 'w-8 h-8 text-[15px]' : 'w-7 h-7 text-[14px]',
          todayDate
            ? 'text-blue-500 dark:text-[#6498c8]'
            : inMonth
            ? 'text-slate-700 dark:text-white/80'
            : 'text-slate-300 dark:text-white/20',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 400 }}
      >
        {formatDayNum(date)}
      </span>

      {/* Events + Note */}
      {(reminders.length > 0 || todos.length > 0 || hasNote) && (
        <div className={`flex flex-col w-full ${tall ? 'gap-1' : 'gap-[3px]'}`}>
          {tall ? (
            <>
              {reminders.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className={`w-full px-2 py-[4px] rounded-md text-[11px] font-semibold leading-tight truncate transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${colors.chip}`}
                >
                  {r.title}
                </div>
              ))}
              {todos.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}
                  className={`w-full px-2 py-[4px] rounded-md text-[11px] font-semibold leading-tight truncate transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] cursor-pointer ${todoChip}`}
                >
                  {t.title}
                </div>
              ))}
              {(reminders.length + todos.length) > 6 && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/25 px-1">
                  +{reminders.length + todos.length - 6} more
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-row flex-wrap lg:flex-col w-full gap-1 lg:gap-[3px]">
              {reminders.slice(0, 4).map((r) => {
                const icon = r.time
                  ? <Clock size={13} />
                  : r.recurrence
                  ? <Repeat size={13} />
                  : <Bell size={13} />
                return (
                  <span key={r.id} className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onReminderClick?.() }}>
                    <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${colors.chip}`}>
                      <span className="shrink-0">{icon}</span>
                      <span className="truncate">{r.title}</span>
                    </span>
                    <span className={`hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded ${colors.chip}`}>
                      {icon}
                    </span>
                    <span className={`flex md:hidden ${colors.text}`}>
                      {icon}
                    </span>
                  </span>
                )
              })}
              {todos.slice(0, 2).map((t) => (
                <span key={t.id} className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onTodoClick?.() }}>
                  <span className={`hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium overflow-hidden transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] ${todoChip}`}>
                    <CheckSquare size={11} className="shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </span>
                  <span className={`hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded ${todoChip}`}>
                    <CheckSquare size={12} />
                  </span>
                  <span className={`flex md:hidden ${cmp < 0 ? 'text-[#e8a045]/70' : 'text-emerald-500/70'}`}>
                    <CheckSquare size={13} />
                  </span>
                </span>
              ))}
              {hasNote && (
                <span className="min-w-0 lg:w-full" onClick={(e) => { e.stopPropagation(); onNoteClick?.() }}>
                  <span className="hidden lg:flex items-center gap-1 w-full px-1.5 py-[3px] rounded-md text-[10px] font-medium transition-all duration-150 hover:brightness-125 hover:shadow-md hover:scale-[1.03] bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35">
                    <FileText size={13} />
                  </span>
                  <span className="hidden md:flex lg:hidden items-center justify-center w-[22px] h-[22px] rounded bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35">
                    <FileText size={13} />
                  </span>
                  <span className="flex md:hidden text-slate-300 dark:text-white/20">
                    <FileText size={13} />
                  </span>
                </span>
              )}
              {(reminders.length + todos.length) > 6 && (
                <span className="text-[9px] text-slate-400 dark:text-white/25 leading-none lg:px-1">
                  +{reminders.length + todos.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  )
}
