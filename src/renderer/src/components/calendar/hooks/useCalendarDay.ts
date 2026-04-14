import { useRef, useLayoutEffect } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { isToday, isSameMonth } from '../../../utils/dates'

interface Params {
  date: Temporal.PlainDate
  displayMonth: Temporal.PlainDate
  isSelected: boolean
}

export function useCalendarDay({ date, displayMonth, isSelected }: Params) {
  const todayDate = isToday(date)
  const inMonth = isSameMonth(date, displayMonth)
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())

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

  const colors =
    cmp < 0
      ? {
          dot: 'bg-[#e8a045]',
          text: 'text-red-600 dark:text-[#e8a045]',
          chip: 'bg-red-50 text-red-700 dark:bg-[#e8a045]/[0.08] dark:text-[#e8a045]',
        }
      : cmp === 0
        ? {
            dot: 'bg-[#e8a045]',
            text: 'text-amber-700 dark:text-[#e8a045]',
            chip: 'bg-amber-50 text-amber-800 dark:bg-[#e8a045]/[0.07] dark:text-[#e8a045]',
          }
        : {
            dot: 'bg-[var(--color-upcoming)]',
            text: 'text-[var(--color-upcoming)]',
            chip: 'bg-[var(--color-upcoming-muted)] text-[var(--color-upcoming)]',
          }

  const listBadgeCls =
    cmp < 0
      ? 'bg-[#e8a045]/[0.12] text-[#e8a045]'
      : 'bg-emerald-500/[0.12] text-emerald-600 dark:bg-emerald-500/[0.08] dark:text-emerald-400'

  let bg: string
  if (todayDate) {
    bg = 'bg-[var(--accent-muted)] paper-light'
  } else if (isSelected) {
    bg = 'bg-white dark:bg-white/[0.10] paper-light'
  } else if (!inMonth) {
    bg = 'bg-slate-50 dark:bg-white/[0.03] paper-light'
  } else {
    bg = 'bg-white dark:bg-white/[0.07] paper-light'
  }

  return { todayDate, inMonth, cmp, colors, listBadgeCls, bg, tileRef, rectRef }
}
