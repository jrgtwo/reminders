import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Temporal } from '@js-temporal/polyfill'
import { getWeekDays, isSameDay, parseDateStr } from '../../utils/dates'
import { getOccurrencesInRange } from '../../utils/recurrence'
import CalendarDay from './CalendarDay'
import { useRemindersStore } from '../../store/reminders.store'
import { useUIStore } from '../../store/ui.store'
import type { Reminder } from '../../types/models'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  displayDate: Temporal.PlainDate
}

export default function WeekView({ displayDate }: Props) {
  const navigate = useNavigate()
  const reminders = useRemindersStore((s) => s.reminders)
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
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <CalendarDay
            key={day.toString()}
            date={day}
            displayMonth={displayDate}
            reminders={remindersByDate[day.toString()] ?? []}
            isSelected={isSameDay(day, selectedPlainDate)}
            onClick={() => handleDayClick(day)}
            tall
          />
        ))}
      </div>
    </div>
  )
}
