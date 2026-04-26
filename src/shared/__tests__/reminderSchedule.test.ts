import { describe, it, expect } from 'vitest'
import {
  nextOccurrenceAt,
  reconcileSchedule,
  uuidToInt,
  isTombstone,
  tombstoneDate,
  type SchedulableReminder,
} from '../reminderSchedule'

function makeReminder(overrides: Partial<SchedulableReminder> = {}): SchedulableReminder {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Test',
    date: '2030-06-15',
    startTime: '09:00',
    completedDates: [],
    ...overrides,
  }
}

describe('nextOccurrenceAt — non-recurring', () => {
  it('returns the fire time when it is in the future', () => {
    const r = makeReminder({ date: '2030-06-15', startTime: '09:00' })
    const now = new Date(2030, 5, 1, 12, 0, 0)
    const fire = nextOccurrenceAt(r, now)
    expect(fire).not.toBeNull()
    expect(fire!.getFullYear()).toBe(2030)
    expect(fire!.getMonth()).toBe(5)
    expect(fire!.getDate()).toBe(15)
    expect(fire!.getHours()).toBe(9)
    expect(fire!.getMinutes()).toBe(0)
  })

  it('returns null when the fire time has passed', () => {
    const r = makeReminder({ date: '2020-01-01', startTime: '09:00' })
    const now = new Date()
    expect(nextOccurrenceAt(r, now)).toBeNull()
  })

  it('returns null when the reminder has no startTime', () => {
    const r = makeReminder({ startTime: undefined })
    expect(nextOccurrenceAt(r, new Date(2030, 0, 1))).toBeNull()
  })

  it('subtracts notifyBefore minutes from the fire time', () => {
    const r = makeReminder({ date: '2030-06-15', startTime: '09:00', notifyBefore: 30 })
    const now = new Date(2030, 5, 1, 12, 0, 0)
    const fire = nextOccurrenceAt(r, now)
    expect(fire!.getHours()).toBe(8)
    expect(fire!.getMinutes()).toBe(30)
  })

  it('returns null when the date appears in completedDates', () => {
    const r = makeReminder({ date: '2030-06-15', completedDates: ['2030-06-15'] })
    expect(nextOccurrenceAt(r, new Date(2030, 5, 1))).toBeNull()
  })
})

describe('nextOccurrenceAt — recurring', () => {
  it('finds the next daily occurrence after now', () => {
    const r = makeReminder({
      date: '2030-06-01',
      startTime: '08:00',
      recurrence: { frequency: 'daily', interval: 1 },
    })
    const now = new Date(2030, 5, 10, 12, 0, 0)
    const fire = nextOccurrenceAt(r, now)
    expect(fire).not.toBeNull()
    expect(fire!.getDate()).toBe(11)
    expect(fire!.getHours()).toBe(8)
  })

  it('skips occurrences that are in completedDates', () => {
    const r = makeReminder({
      date: '2030-06-01',
      startTime: '08:00',
      recurrence: { frequency: 'daily', interval: 1 },
      completedDates: ['2030-06-11', '2030-06-12'],
    })
    const now = new Date(2030, 5, 10, 12, 0, 0)
    const fire = nextOccurrenceAt(r, now)
    expect(fire!.getDate()).toBe(13)
  })

  it('respects weekly byDay', () => {
    // Mondays only — 2030-06-03 is a Monday
    const r = makeReminder({
      date: '2030-06-03',
      startTime: '09:00',
      recurrence: { frequency: 'weekly', interval: 1, byDay: [1] },
    })
    const now = new Date(2030, 5, 5, 0, 0, 0) // Wed Jun 5
    const fire = nextOccurrenceAt(r, now)
    expect(fire!.getDay()).toBe(1) // Monday
    expect(fire!.getDate()).toBe(10) // next Monday
  })

  it('returns null past the recurrence endDate', () => {
    const r = makeReminder({
      date: '2030-06-01',
      startTime: '08:00',
      recurrence: { frequency: 'daily', interval: 1, endDate: '2030-06-05' },
    })
    const now = new Date(2030, 5, 10, 0, 0, 0)
    expect(nextOccurrenceAt(r, now)).toBeNull()
  })
})

describe('reconcileSchedule — horizon enforcement', () => {
  it('schedules all reminders below the horizon', () => {
    const reminders: SchedulableReminder[] = [
      makeReminder({ id: '11111111-1111-1111-1111-111111111111', date: '2030-06-15', startTime: '09:00' }),
      makeReminder({ id: '22222222-2222-2222-2222-222222222222', date: '2030-06-16', startTime: '09:00' }),
      makeReminder({ id: '33333333-3333-3333-3333-333333333333', date: '2030-06-17', startTime: '09:00' }),
    ]
    const now = new Date(2030, 5, 1, 0, 0, 0)
    const result = reconcileSchedule(reminders, [], now)
    expect(result.toSchedule).toHaveLength(3)
    expect(result.toCancel).toHaveLength(0)
  })

  it('caps at horizon=50 when more reminders fall in window', () => {
    const reminders: SchedulableReminder[] = []
    for (let i = 0; i < 75; i++) {
      reminders.push(
        makeReminder({
          id: `${i.toString(16).padStart(8, '0')}-0000-0000-0000-000000000000`,
          date: '2030-06-15',
          startTime: `${String(8 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
        }),
      )
    }
    const now = new Date(2030, 5, 1, 0, 0, 0)
    const result = reconcileSchedule(reminders, [], now)
    expect(result.toSchedule).toHaveLength(50)
  })

  it('schedules only reminders within the daysAhead window', () => {
    const reminders = [
      makeReminder({ id: '11111111-1111-1111-1111-111111111111', date: '2030-06-15', startTime: '09:00' }),
      makeReminder({ id: '22222222-2222-2222-2222-222222222222', date: '2030-12-15', startTime: '09:00' }),
    ]
    const now = new Date(2030, 5, 1, 0, 0, 0)
    const result = reconcileSchedule(reminders, [], now, { daysAhead: 30 })
    expect(result.toSchedule).toHaveLength(1)
    expect(result.toSchedule[0].reminderId).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('returns toCancel for pending notifications no longer in the schedule', () => {
    const reminders = [
      makeReminder({ id: '11111111-1111-1111-1111-111111111111', date: '2030-06-15', startTime: '09:00' }),
    ]
    const stalePending = [
      { id: uuidToInt('99999999-9999-9999-9999-999999999999'), scheduleAt: new Date(2030, 5, 20) },
    ]
    const now = new Date(2030, 5, 1, 0, 0, 0)
    const result = reconcileSchedule(reminders, stalePending, now)
    expect(result.toCancel).toContain(uuidToInt('99999999-9999-9999-9999-999999999999'))
  })

  it('does not include tombstones in toCancel — those are handled separately', () => {
    const tombstoneId = uuidToInt('99999999-9999-9999-9999-999999999999')
    const pending = [{ id: tombstoneId, scheduleAt: tombstoneDate() }]
    const now = new Date(2030, 5, 1, 0, 0, 0)
    const result = reconcileSchedule([], pending, now)
    expect(result.toCancel).not.toContain(tombstoneId)
  })
})

describe('isTombstone / tombstoneDate', () => {
  it('round-trips the sentinel', () => {
    expect(isTombstone(tombstoneDate())).toBe(true)
  })

  it('returns false for normal future dates', () => {
    expect(isTombstone(new Date(2030, 5, 15))).toBe(false)
  })

  it('returns true for any year >= 2099', () => {
    expect(isTombstone(new Date(2099, 0, 1))).toBe(true)
    expect(isTombstone(new Date(2150, 0, 1))).toBe(true)
  })
})

describe('uuidToInt', () => {
  it('produces a stable positive int from a UUID', () => {
    const id = uuidToInt('11111111-2222-3333-4444-555555555555')
    expect(id).toBeGreaterThan(0)
    expect(id).toBe(uuidToInt('11111111-2222-3333-4444-555555555555'))
  })
})
