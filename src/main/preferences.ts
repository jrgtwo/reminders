import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface AppPreferences {
  showNotificationContent: boolean
  snoozeDuration: number // minutes
}

const DEFAULTS: AppPreferences = {
  showNotificationContent: false,
  snoozeDuration: 10,
}

function prefsFile(): string {
  return join(app.getPath('userData'), 'preferences.json')
}

export function loadPreferences(): AppPreferences {
  try {
    const file = prefsFile()
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, 'utf-8'))
      return { ...DEFAULTS, ...parsed }
    }
  } catch {
    // ignore corrupt file
  }
  return { ...DEFAULTS }
}

export function savePreferences(prefs: Partial<AppPreferences>): AppPreferences {
  const current = loadPreferences()
  const merged = { ...current, ...prefs }
  try {
    writeFileSync(prefsFile(), JSON.stringify(merged), 'utf-8')
  } catch {
    // ignore write failure
  }
  return merged
}
