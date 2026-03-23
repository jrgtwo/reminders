import { ipcMain } from 'electron'
import { syncEngine } from '../sync'
import type { Session } from '@supabase/supabase-js'
import type { SyncConfig } from '../sync'

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:trigger', async (_e, session: Session, config: SyncConfig) => {
    await syncEngine.sync(session, config)
    return syncEngine.getStatus()
  })

  ipcMain.handle('sync:getStatus', () => syncEngine.getStatus())

  ipcMain.handle(
    'sync:checkFirstLogin',
    (_e, userId: string, session: Session, config: SyncConfig) =>
      syncEngine.checkFirstLogin(userId, session, config)
  )

  ipcMain.handle('sync:markFirstLoginDone', (_e, userId: string) =>
    syncEngine.markFirstLoginDone(userId)
  )
}
