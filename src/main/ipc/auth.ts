import { ipcMain, shell } from 'electron'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:openExternal', (_, url: string) => {
    shell.openExternal(url)
  })
}
