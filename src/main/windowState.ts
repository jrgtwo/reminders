import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface WindowBounds {
  width: number
  height: number
  x?: number
  y?: number
}

const DEFAULTS: WindowBounds = { width: 1200, height: 800 }

function stateFile(): string {
  return join(app.getPath('userData'), 'windowState.json')
}

export function loadWindowState(): WindowBounds {
  try {
    const file = stateFile()
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, 'utf-8'))
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        return parsed as WindowBounds
      }
    }
  } catch {
    // ignore corrupt file
  }
  return { ...DEFAULTS }
}

export function saveWindowState(window: BrowserWindow): void {
  if (window.isMaximized() || window.isMinimized() || window.isFullScreen()) return
  const bounds = window.getBounds()
  try {
    writeFileSync(stateFile(), JSON.stringify(bounds), 'utf-8')
  } catch {
    // ignore
  }
}
