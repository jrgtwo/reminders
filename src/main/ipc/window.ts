import { ipcMain, BrowserWindow, dialog } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { DialogSaveSchema } from './schemas'

export function registerWindowHandlers() {
  ipcMain.on('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.on('window:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })

  ipcMain.handle('dialog:save', async (e, input: unknown) => {
    const { defaultName, data } = DialogSaveSchema.parse(input)
    const win = BrowserWindow.fromWebContents(e.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return false
    writeFileSync(result.filePath, data, 'utf-8')
    return true
  })

  ipcMain.handle('dialog:open', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const result = await dialog.showOpenDialog(win!, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths.length) return null
    return readFileSync(result.filePaths[0], 'utf-8')
  })
}
