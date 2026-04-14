import { ipcMain } from 'electron'
import * as repo from '../storage/reminders.repo'
import { ReminderSchema, DateStr, Id } from './schemas'

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
}
