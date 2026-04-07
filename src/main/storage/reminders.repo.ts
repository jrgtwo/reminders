import { getDb } from './db'
import type { Reminder } from '../../renderer/src/types/models'

export function getAllReminders(): Reminder[] {
  const rows = getDb().prepare('SELECT * FROM reminders WHERE deleted_at IS NULL').all() as any[]
  return rows.map(deserialize)
}

export function getRemindersByDate(date: string): Reminder[] {
  const rows = getDb()
    .prepare('SELECT * FROM reminders WHERE deleted_at is NULL AND date = ?')
    .all(date) as any[]
  return rows.map(deserialize)
}

export function saveReminder(r: Reminder): Reminder {
  getDb()
    .prepare(
      `INSERT INTO reminders (id, title, description, date, start_time, end_time, recurrence,
 completed_dates, created_at, updated_at)
        VALUES (@id, @title, @description, @date, @start_time, @end_time, @recurrence,
 @completed_dates, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          title = @title, description = @description, date = @date, start_time = @start_time,
          end_time = @end_time, recurrence = @recurrence, completed_dates = @completed_dates,
          updated_at = @updated_at`
    )
    .run(serialize(r))
  return r
}

export function deleteReminder(id: string): void {
  const date = new Date().toISOString()
  getDb()
    .prepare('UPDATE reminders SET deleted_at =?, updated_at = ? where id=?')
    .run(date, date, id)
}

function serialize(r: Reminder) {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    date: r.date,
    start_time: r.startTime ?? null,
    end_time: r.endTime ?? null,
    recurrence: r.recurrence ? JSON.stringify(r.recurrence) : null,
    completed_dates: JSON.stringify(r.completedDates),
    created_at: r.createdAt,
    updated_at: r.updatedAt
  }
}

function deserialize(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
    completedDates: JSON.parse(row.completed_dates),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
