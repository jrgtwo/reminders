import { app, BrowserWindow } from 'electron'

let pendingCallbackUrl: string | null = null

export function setupAuth(): void {
  // Register the custom protocol so the OS routes reminders:// URLs to this app
  if (process.defaultApp) {
    // Dev: launched via `electron .`, argv[1] is the script path
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('reminders', process.execPath, [process.argv[1]])
    }
  } else {
    app.setAsDefaultProtocolClient('reminders')
  }

  // macOS / Linux: deep link arrives via open-url (may fire before window exists)
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleCallbackUrl(url)
  })
}

export function handleSecondInstanceUrl(argv: string[]): void {
  // Windows: deep link comes in as a command-line arg in the second instance
  const url = argv.find((arg) => arg.startsWith('reminders://'))
  if (url) handleCallbackUrl(url)
}

export function flushPendingCallback(win: BrowserWindow): void {
  if (pendingCallbackUrl) {
    win.webContents.send('auth:callback', pendingCallbackUrl)
    pendingCallbackUrl = null
  }
}

function handleCallbackUrl(url: string): void {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length > 0) {
    const win = wins[0]
    win.webContents.send('auth:callback', url)
    if (win.isMinimized()) win.restore()
    win.focus()
  } else {
    // Window not ready yet — queue it
    pendingCallbackUrl = url
  }
}
