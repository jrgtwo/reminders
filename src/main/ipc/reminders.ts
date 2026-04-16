import { ipcMain } from 'electron'
import { z } from 'zod'
import * as repo from '../storage/reminders.repo'
import { ReminderSchema, DateStr, Id } from './schemas'
import { snoozeReminder, getActiveSnoozed } from '../notifications'

const SnoozeSchema = z.object({
  reminderId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().positive(),
})

export function registerReminderHandlers() {
  ipcMain.handle('reminders:getAll', () => repo.getAllReminders())
  ipcMain.handle('reminders:getByDate', (_e, date: unknown) => {
    const d = DateStr.parse(date)
    return repo.getRemindersByDate(d)
  })
  ipcMain.handle('reminders:save', (_e, r: unknown) => {
    const reminder = ReminderSchema.parse(r)
    return repo.saveReminder(reminder)
  })
  ipcMain.handle('reminders:delete', (_e, id: unknown) => {
    const validId = Id.parse(id)
    return repo.deleteReminder(validId)
  })

  ipcMain.handle('snooze:set', (_e, data: unknown) => {
    const { reminderId, date, minutes } = SnoozeSchema.parse(data)
    snoozeReminder(reminderId, date, minutes)
  })
  ipcMain.handle('snooze:getActive', () => getActiveSnoozed())
}
