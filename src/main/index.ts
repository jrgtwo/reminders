import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerReminderHandlers } from './ipc/reminders'
import { registerNoteHandlers } from './ipc/notes'
import { registerTodoHandlers } from './ipc/todos'
import { registerWindowHandlers } from './ipc/window'
import { registerAuthHandlers } from './ipc/auth'
import { startNotificationScheduler } from './notifications'
import { setupTray } from './tray'
import { loadWindowState, saveWindowState } from './windowState'
import { setupAutoUpdater } from './updater'
import { setupAuth, handleSecondInstanceUrl, flushPendingCallback } from './auth'

// Single-instance lock — required for Windows deep-link OAuth callback
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// Register custom protocol and macOS open-url handler early
setupAuth()

function createWindow(): BrowserWindow {
  const state = loadWindowState()

  const mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    ...(state.x !== undefined && state.y !== undefined ? { x: state.x, y: state.y } : {}),
    title: 'Reminders',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Flush any OAuth callback that arrived before the window was ready
    flushPendingCallback(mainWindow)
  })

  mainWindow.on('close', () => {
    saveWindowState(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Windows: second instance carries the deep-link URL in argv
  app.on('second-instance', (_, argv) => {
    handleSecondInstanceUrl(argv)
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore()
      wins[0].focus()
    }
  })

  registerWindowHandlers()
  registerReminderHandlers()
  registerNoteHandlers()
  registerTodoHandlers()
  registerAuthHandlers()
  startNotificationScheduler()
  setupAutoUpdater()

  const mainWindow = createWindow()
  setupTray(mainWindow)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
