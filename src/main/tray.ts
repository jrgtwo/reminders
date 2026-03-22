import { app, Menu, Tray, BrowserWindow, nativeImage } from 'electron'
import icon from '../../resources/icon.png?asset'

let tray: Tray | null = null

export function setupTray(mainWindow: BrowserWindow): void {
  const img = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(img)
  tray.setToolTip('Reminders')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Reminders',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: 'New Reminder',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        const today = new Date().toISOString().slice(0, 10)
        mainWindow.webContents.send('navigate', `/day/${today}`)
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}
