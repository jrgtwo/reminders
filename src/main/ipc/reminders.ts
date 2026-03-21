 import { ipcMain } from 'electron'
 import * as repo from '../storage/reminders.repo'
 import type { Reminder } from '../../renderer/src/types/models'

 export function registerReminderHandlers() {
   ipcMain.handle('reminders:getAll', () => repo.getAllReminders())
   ipcMain.handle('reminders:getByDate', (_e, date: string) =>
 repo.getRemindersByDate(date))
   ipcMain.handle('reminders:save', (_e, r: Reminder) => repo.saveReminder(r))
   ipcMain.handle('reminders:delete', (_e, id: string) => repo.deleteReminder(id))
 }