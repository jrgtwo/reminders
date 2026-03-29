import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getWeekDays, isSameDay, parseDateStr } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import CalendarDay from './CalendarDay'
import { useRemindersStore } from '../../store/reminders.store'
import { useNotesStore } from '../../store/notes.store'
import { useUIStore } from '../../store/ui.store'
import type { Reminder } from '../../types/models'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  displayDate: Temporal.PlainDate
}

export default function WeekView({ displayDate }: Props) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const noteDates = useNotesStore((s) => s.noteDates)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const days = useMemo(() => getWeekDays(displayDate), [displayDate])

  const remindersByDate = useMemo(() => {
    const map: Record<string, Reminder[]> = {}
    for (const reminder of reminders) {
      for (const dateStr of getOccurrencesInRange(reminder, days[0], days[6])) {
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(reminder)
      }
    }
    return map
  }, [reminders, days])

  const selectedPlainDate = useMemo(() => parseDateStr(selectedDate), [selectedDate])

  function handleDayClick(date: Temporal.PlainDate) {
    const dateStr = date.toString()
    setSelectedDate(dateStr)
    navigate(`/day/${dateStr}`)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/[0.06] bg-[#F3F4F6] dark:bg-[#0d1117]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 dark:text-white/18"
          >
            {name}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 gap-[2px] bg-slate-200/60 dark:bg-white/[0.04]">
        {days.map((day) => (
          <CalendarDay
            key={day.toString()}
            date={day}
            displayMonth={displayDate}
            reminders={remindersByDate[day.toString()] ?? []}
            hasNote={noteDates.includes(day.toString())}
            isSelected={isSameDay(day, selectedPlainDate)}
            isWeekend={day.dayOfWeek === 6 || day.dayOfWeek === 7}
            onClick={() => handleDayClick(day)}
            tall
          />
        ))}
      </div>
    </div>
  )
}
