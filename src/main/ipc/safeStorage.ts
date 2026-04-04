import { ipcMain, safeStorage, app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'

function keyPath(userId: string): string {
  // userId is a Supabase UUID — safe to use in a filename
  return join(app.getPath('userData'), `enc_key_${userId}.bin`)
}

export function registerSafeStorageHandlers(): void {
  ipcMain.handle('safeStorage:save', (_, userId: string, b64: string) => {
    if (!safeStorage.isEncryptionAvailable()) return
    const encrypted = safeStorage.encryptString(b64)
    writeFileSync(keyPath(userId), encrypted)
  })

  ipcMain.handle('safeStorage:load', (_, userId: string): string | null => {
    if (!safeStorage.isEncryptionAvailable()) return null
    try {
      const encrypted = readFileSync(keyPath(userId))
      return safeStorage.decryptString(Buffer.from(encrypted))
    } catch {
      return null
    }
  })

  ipcMain.handle('safeStorage:clear', (_, userId: string) => {
    try { unlinkSync(keyPath(userId)) } catch {}
  })
}
