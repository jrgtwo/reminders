import { describe, it, expect } from 'vitest'
import {
  parseDateStr,
  toDateStr,
  formatWeekRange,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getMonthGrid,
  getWeekDays,
} from '../dates'

// Temporal dayOfWeek: Mon=1 ... Sat=6, Sun=7

describe('parseDateStr / toDateStr', () => {
  it('parses year, month, day from YYYY-MM-DD', () => {
    const d = parseDateStr('2024-03-15')
    expect(d.year).toBe(2024)
    expect(d.month).toBe(3)
    expect(d.day).toBe(15)
  })

  it('roundtrips through toDateStr', () => {
    expect(toDateStr(parseDateStr('2024-03-15'))).toBe('2024-03-15')
    expect(toDateStr(parseDateStr('2024-12-01'))).toBe('2024-12-01')
  })
})

describe('isSameDay', () => {
  it('returns true for identical dates', () => {
    expect(isSameDay(parseDateStr('2024-03-15'), parseDateStr('2024-03-15'))).toBe(true)
  })

  it('returns false for different days in same month', () => {
    expect(isSameDay(parseDateStr('2024-03-15'), parseDateStr('2024-03-16'))).toBe(false)
  })

  it('returns false for same day in different month', () => {
    expect(isSameDay(parseDateStr('2024-03-15'), parseDateStr('2024-04-15'))).toBe(false)
  })
})

describe('isSameMonth', () => {
  it('returns true for same year and month', () => {
    expect(isSameMonth(parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toBe(true)
  })

  it('returns false for different months', () => {
    expect(isSameMonth(parseDateStr('2024-03-01'), parseDateStr('2024-04-01'))).toBe(false)
  })

  it('returns false for same month in different year', () => {
    expect(isSameMonth(parseDateStr('2024-03-01'), parseDateStr('2025-03-01'))).toBe(false)
  })
})

describe('addMonths / subMonths', () => {
  it('adds months correctly', () => {
    expect(toDateStr(addMonths(parseDateStr('2024-03-15'), 1))).toBe('2024-04-15')
  })

  it('subtracts months correctly', () => {
    expect(toDateStr(subMonths(parseDateStr('2024-03-15'), 2))).toBe('2024-01-15')
  })

  it('crosses year boundary forward', () => {
    expect(toDateStr(addMonths(parseDateStr('2024-11-01'), 3))).toBe('2025-02-01')
  })

  it('crosses year boundary backward', () => {
    expect(toDateStr(subMonths(parseDateStr('2024-02-01'), 3))).toBe('2023-11-01')
  })

  it('clamps to last day of month on overflow (leap year)', () => {
    // Jan 31 + 1 month = Feb 29 in 2024 (leap year)
    expect(toDateStr(addMonths(parseDateStr('2024-01-31'), 1))).toBe('2024-02-29')
  })

  it('clamps to last day of month on overflow (non-leap year)', () => {
    // Jan 31 + 1 month = Feb 28 in 2023 (non-leap year)
    expect(toDateStr(addMonths(parseDateStr('2023-01-31'), 1))).toBe('2023-02-28')
  })
})

describe('addWeeks / subWeeks', () => {
  it('adds weeks correctly', () => {
    expect(toDateStr(addWeeks(parseDateStr('2024-03-01'), 2))).toBe('2024-03-15')
  })

  it('subtracts weeks correctly', () => {
    expect(toDateStr(subWeeks(parseDateStr('2024-03-15'), 1))).toBe('2024-03-08')
  })

  it('crosses month boundary', () => {
    expect(toDateStr(addWeeks(parseDateStr('2024-03-25'), 1))).toBe('2024-04-01')
  })
})

describe('getMonthGrid', () => {
  it('always returns a multiple of 7 cells', () => {
    for (const s of ['2024-01-15', '2024-02-01', '2024-03-01', '2024-07-01', '2024-12-01']) {
      const grid = getMonthGrid(parseDateStr(s))
      expect(grid.length % 7, `length for ${s}`).toBe(0)
    }
  })

  it('first cell is always Sunday (dayOfWeek === 7)', () => {
    for (const s of ['2024-01-15', '2024-02-01', '2024-03-01', '2024-12-01']) {
      const grid = getMonthGrid(parseDateStr(s))
      expect(grid[0].dayOfWeek, `first day for ${s}`).toBe(7)
    }
  })

  it('last cell is always Saturday (dayOfWeek === 6)', () => {
    for (const s of ['2024-01-15', '2024-02-01', '2024-03-01', '2024-12-01']) {
      const grid = getMonthGrid(parseDateStr(s))
      expect(grid[grid.length - 1].dayOfWeek, `last day for ${s}`).toBe(6)
    }
  })

  it('contains all days of the queried month', () => {
    const grid = getMonthGrid(parseDateStr('2024-03-01'))
    const march = grid.filter((d) => d.month === 3 && d.year === 2024)
    expect(march.length).toBe(31)
  })

  it('consecutive days are one apart', () => {
    const grid = getMonthGrid(parseDateStr('2024-03-01'))
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i].equals(grid[i - 1].add({ days: 1 }))).toBe(true)
    }
  })

  it('handles February in a leap year (29 days)', () => {
    const grid = getMonthGrid(parseDateStr('2024-02-01'))
    expect(grid.filter((d) => d.month === 2 && d.year === 2024).length).toBe(29)
  })

  it('handles February in a non-leap year (28 days)', () => {
    const grid = getMonthGrid(parseDateStr('2023-02-01'))
    expect(grid.filter((d) => d.month === 2 && d.year === 2023).length).toBe(28)
  })
})

describe('getWeekDays', () => {
  it('returns exactly 7 days', () => {
    expect(getWeekDays(parseDateStr('2024-03-15')).length).toBe(7)
  })

  it('first day is Sunday (dayOfWeek === 7)', () => {
    const days = getWeekDays(parseDateStr('2024-03-15')) // Friday
    expect(days[0].dayOfWeek).toBe(7)
  })

  it('last day is Saturday (dayOfWeek === 6)', () => {
    const days = getWeekDays(parseDateStr('2024-03-15'))
    expect(days[6].dayOfWeek).toBe(6)
  })

  it('contains the given date', () => {
    const date = parseDateStr('2024-03-15')
    expect(getWeekDays(date).some((d) => d.equals(date))).toBe(true)
  })

  it('days are consecutive', () => {
    const days = getWeekDays(parseDateStr('2024-03-15'))
    for (let i = 1; i < days.length; i++) {
      expect(days[i].equals(days[i - 1].add({ days: 1 }))).toBe(true)
    }
  })

  it('returns same week regardless of which day in the week is passed', () => {
    // 2024-03-10 (Sun) through 2024-03-16 (Sat) — passing any of these should give same grid
    const ref = getWeekDays(parseDateStr('2024-03-10'))
    for (let offset = 1; offset <= 6; offset++) {
      const days = getWeekDays(parseDateStr('2024-03-10').add({ days: offset }))
      expect(toDateStr(days[0])).toBe(toDateStr(ref[0]))
    }
  })
})

describe('formatWeekRange', () => {
  it('formats same-month range correctly', () => {
    // 2024-03-15 (Fri) → week is Sun Mar 10 – Sat Mar 16
    const days = getWeekDays(parseDateStr('2024-03-15'))
    expect(formatWeekRange(days)).toBe('March 10 \u2013 16, 2024')
  })

  it('formats cross-month range with abbreviated month names', () => {
    // 2024-03-31 (Sun) → week is Sun Mar 31 – Sat Apr 6
    const days = getWeekDays(parseDateStr('2024-03-31'))
    const result = formatWeekRange(days)
    expect(result).toContain('Mar')
    expect(result).toContain('Apr')
    expect(result).toContain('2024')
  })

  it('returns empty string for empty array', () => {
    expect(formatWeekRange([])).toBe('')
  })
})
