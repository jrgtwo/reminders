import { ipcMain } from 'electron'
import { syncEngine } from '../sync'
import type { Session } from '@supabase/supabase-js'

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:trigger', async (_e, session: Session) => {
    await syncEngine.sync(session)
    return syncEngine.getStatus()
  })

  ipcMain.handle('sync:getStatus', () => syncEngine.getStatus())
}
