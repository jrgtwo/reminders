import { ipcMain, safeStorage, app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { UserIdSchema } from './schemas'
import { z } from 'zod'

function keyPath(userId: string): string {
  return join(app.getPath('userData'), `enc_key_${userId}.bin`)
}

export function registerSafeStorageHandlers(): void {
  ipcMain.handle('safeStorage:save', (_, userId: unknown, b64: unknown) => {
    const uid = UserIdSchema.parse(userId)
    const key = z.string().min(1).parse(b64)
    if (!safeStorage.isEncryptionAvailable()) return
    const encrypted = safeStorage.encryptString(key)
    writeFileSync(keyPath(uid), encrypted)
  })

  ipcMain.handle('safeStorage:load', (_, userId: unknown): string | null => {
    const uid = UserIdSchema.parse(userId)
    if (!safeStorage.isEncryptionAvailable()) return null
    try {
      const encrypted = readFileSync(keyPath(uid))
      return safeStorage.decryptString(Buffer.from(encrypted))
    } catch {
      return null
    }
  })

  ipcMain.handle('safeStorage:clear', (_, userId: unknown) => {
    const uid = UserIdSchema.parse(userId)
    try { unlinkSync(keyPath(uid)) } catch {}
  })
}
