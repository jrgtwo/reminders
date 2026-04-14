import { ipcMain } from 'electron'
import { loadPreferences, savePreferences } from '../preferences'
import { z } from 'zod'

const PrefsUpdateSchema = z.object({
  showNotificationContent: z.boolean().optional(),
})

export function registerPreferencesHandlers(): void {
  ipcMain.handle('preferences:get', () => loadPreferences())

  ipcMain.handle('preferences:set', (_e, prefs: unknown) => {
    const validated = PrefsUpdateSchema.parse(prefs)
    return savePreferences(validated)
  })
}
