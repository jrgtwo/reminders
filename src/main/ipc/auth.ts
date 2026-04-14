import { ipcMain, shell } from 'electron'
import { ExternalUrlSchema } from './schemas'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:openExternal', (_, url: unknown) => {
    const validated = ExternalUrlSchema.parse(url)
    shell.openExternal(validated)
  })
}
