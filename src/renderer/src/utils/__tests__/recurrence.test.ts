import { describe, it, expect } from 'vitest'
import { getOccurrencesInRange } from '../recurrence'
import { parseDateStr } from '../dates'
import type { Reminder } from '../../types/models'

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'test-id',
    title: 'Test',
    date: '2024-01-15',
    completedDates: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getOccurrencesInRange — non-recurring', () => {
  it('returns the date when it falls within range', () => {
    const r = makeReminder({ date: '2024-03-15' })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      ['2024-03-15']
    )
  })

  it('returns empty when date is before range', () => {
    const r = makeReminder({ date: '2024-02-28' })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      []
    )
  })

  it('returns empty when date is after range', () => {
    const r = makeReminder({ date: '2024-04-01' })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      []
    )
  })

  it('includes date equal to range start', () => {
    const r = makeReminder({ date: '2024-03-01' })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      ['2024-03-01']
    )
  })

  it('includes date equal to range end', () => {
    const r = makeReminder({ date: '2024-03-31' })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      ['2024-03-31']
    )
  })
})

describe('getOccurrencesInRange — daily recurrence', () => {
  it('returns all occurrences within range', () => {
    const r = makeReminder({ date: '2024-03-01', recurrence: { frequency: 'daily', interval: 1 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-05'))).toEqual(
      ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05']
    )
  })

  it('respects interval (every 2 days)', () => {
    const r = makeReminder({ date: '2024-03-01', recurrence: { frequency: 'daily', interval: 2 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-07'))).toEqual(
      ['2024-03-01', '2024-03-03', '2024-03-05', '2024-03-07']
    )
  })

  it('stops at endDate', () => {
    const r = makeReminder({
      date: '2024-03-01',
      recurrence: { frequency: 'daily', interval: 1, endDate: '2024-03-03' },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-10'))).toEqual(
      ['2024-03-01', '2024-03-02', '2024-03-03']
    )
  })

  it('stops after count occurrences', () => {
    const r = makeReminder({
      date: '2024-03-01',
      recurrence: { frequency: 'daily', interval: 1, count: 3 },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-10'))).toEqual(
      ['2024-03-01', '2024-03-02', '2024-03-03']
    )
  })

  it('excludes occurrences before range start', () => {
    const r = makeReminder({ date: '2024-03-01', recurrence: { frequency: 'daily', interval: 1 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-03'), parseDateStr('2024-03-05'))).toEqual(
      ['2024-03-03', '2024-03-04', '2024-03-05']
    )
  })

  it('returns empty when reminder starts after range', () => {
    const r = makeReminder({ date: '2024-04-01', recurrence: { frequency: 'daily', interval: 1 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      []
    )
  })

  it('returns empty when endDate is before range start', () => {
    const r = makeReminder({
      date: '2024-01-01',
      recurrence: { frequency: 'daily', interval: 1, endDate: '2024-02-28' },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-01'), parseDateStr('2024-03-31'))).toEqual(
      []
    )
  })
})

describe('getOccurrencesInRange — weekly recurrence', () => {
  it('returns weekly occurrences (every Monday)', () => {
    // 2024-03-04 is a Monday
    const r = makeReminder({ date: '2024-03-04', recurrence: { frequency: 'weekly', interval: 1 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-04'), parseDateStr('2024-03-25'))).toEqual(
      ['2024-03-04', '2024-03-11', '2024-03-18', '2024-03-25']
    )
  })

  it('respects interval (every 2 weeks)', () => {
    const r = makeReminder({ date: '2024-03-04', recurrence: { frequency: 'weekly', interval: 2 } })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-04'), parseDateStr('2024-03-31'))).toEqual(
      ['2024-03-04', '2024-03-18']
    )
  })

  it('respects byDay (Mon + Wed + Fri)', () => {
    // 2024-03-04 is Monday; byDay: [1,3,5] = Mon, Wed, Fri
    const r = makeReminder({
      date: '2024-03-04',
      recurrence: { frequency: 'weekly', interval: 1, byDay: [1, 3, 5] },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-03-04'), parseDateStr('2024-03-08'))).toEqual(
      ['2024-03-04', '2024-03-06', '2024-03-08']
    )
  })
})

describe('getOccurrencesInRange — monthly recurrence', () => {
  it('returns monthly occurrences on same day-of-month', () => {
    const r = makeReminder({
      date: '2024-01-15',
      recurrence: { frequency: 'monthly', interval: 1 },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-01-01'), parseDateStr('2024-04-30'))).toEqual(
      ['2024-01-15', '2024-02-15', '2024-03-15', '2024-04-15']
    )
  })

  it('respects interval (every 3 months)', () => {
    const r = makeReminder({
      date: '2024-01-01',
      recurrence: { frequency: 'monthly', interval: 3 },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2024-01-01'), parseDateStr('2025-01-01'))).toEqual(
      ['2024-01-01', '2024-04-01', '2024-07-01', '2024-10-01', '2025-01-01']
    )
  })
})

describe('getOccurrencesInRange — yearly recurrence', () => {
  it('returns yearly occurrences', () => {
    const r = makeReminder({
      date: '2020-06-15',
      recurrence: { frequency: 'yearly', interval: 1 },
    })
    expect(getOccurrencesInRange(r, parseDateStr('2020-01-01'), parseDateStr('2023-12-31'))).toEqual(
      ['2020-06-15', '2021-06-15', '2022-06-15', '2023-06-15']
    )
  })
})
