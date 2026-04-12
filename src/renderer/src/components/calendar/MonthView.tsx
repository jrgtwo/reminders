import { Temporal } from '@js-temporal/polyfill'
import CalendarDay from './CalendarDay'
import { useMonthView } from './hooks/useMonthView'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  displayDate: Temporal.PlainDate
}

export default function MonthView({ displayDate }: Props) {
  const {
    days,
    remindersByDate,
    noteCountByDate,
    listCountByDate,
    selectedPlainDate,
    isSameDay,
    gridRef,
    glow,
    handleDayClick,
    handleReminderClick,
    handleNoteClick,
    handleTodoClick,
    handleGridMouseMove,
    handleGridMouseLeave,
  } = useMonthView({ displayDate })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/[0.06] bg-[var(--bg-app)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-[12px] font-semibold text-slate-400 dark:text-white/55"
          >
            {name}
          </div>
        ))}
      </div>
      <div
        ref={gridRef}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
        style={{
          backgroundImage: glow.active
            ? `radial-gradient(circle at ${glow.x}px ${glow.y}px, rgba(255,255,255,0.008) 0%, transparent 100px)`
            : 'none'
        }}
        className="grid grid-cols-7 auto-rows-[80px] md:auto-rows-[110px] lg:auto-rows-[160px] gap-1 bg-[var(--bg-app)] p-1.5"
      >
        {days.map((day) => (
          <CalendarDay
            key={day.toString()}
            date={day}
            displayMonth={displayDate}
            reminders={remindersByDate[day.toString()] ?? []}
            listCount={listCountByDate[day.toString()] ?? 0}
            noteCount={noteCountByDate[day.toString()] ?? 0}
            isSelected={isSameDay(day, selectedPlainDate)}
            onClick={() => handleDayClick(day)}
            onReminderClick={() => handleReminderClick(day)}
            onNoteClick={() => handleNoteClick(day)}
            onTodoClick={() => handleTodoClick(day)}
          />
        ))}
      </div>
    </div>
  )
}
