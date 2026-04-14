import { ipcMain } from 'electron'
import { syncEngine } from '../sync'
import { SessionSchema, SyncConfigSchema, UserIdSchema } from './schemas'

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:trigger', async (_e, session: unknown, config: unknown) => {
    const s = SessionSchema.parse(session)
    const c = SyncConfigSchema.parse(config)
    await syncEngine.sync(s as any, c)
    return syncEngine.getStatus()
  })

  ipcMain.handle('sync:getStatus', () => syncEngine.getStatus())

  ipcMain.handle(
    'sync:checkFirstLogin',
    (_e, userId: unknown, session: unknown, config: unknown) => {
      const uid = UserIdSchema.parse(userId)
      const s = SessionSchema.parse(session)
      const c = SyncConfigSchema.parse(config)
      return syncEngine.checkFirstLogin(uid, s as any, c)
    }
  )

  ipcMain.handle('sync:markFirstLoginDone', (_e, userId: unknown) => {
    const uid = UserIdSchema.parse(userId)
    return syncEngine.markFirstLoginDone(uid)
  })
}
