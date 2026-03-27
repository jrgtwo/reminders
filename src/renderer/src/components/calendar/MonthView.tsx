import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getMonthGrid, isSameDay, parseDateStr } from '../../utils/dates'
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

export default function MonthView({ displayDate }: Props) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
  const noteDates = useNotesStore((s) => s.noteDates)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const days = useMemo(() => getMonthGrid(displayDate), [displayDate])

  const remindersByDate = useMemo(() => {
    const gridStart = days[0]
    const gridEnd = days[days.length - 1]
    const map: Record<string, Reminder[]> = {}
    for (const reminder of reminders) {
      for (const dateStr of getOccurrencesInRange(reminder, gridStart, gridEnd)) {
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
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.04] dark:backdrop-blur-sm">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[100px] gap-px bg-gray-200 dark:bg-white/[0.04] overflow-y-auto flex-1">
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
          />
        ))}
      </div>
    </div>
  )
}
