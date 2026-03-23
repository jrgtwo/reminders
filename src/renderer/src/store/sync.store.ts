import { create } from 'zustand'
import { useAuthStore } from './auth.store'

type SyncStatus = 'idle' | 'syncing' | 'error'
export type MigrationCase = 'local-only' | 'cloud-only' | 'both' | 'neither'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  migrationCase: MigrationCase | null
  /** True while checkFirstLogin is in-flight — blocks focus-triggered syncs */
  checkingFirstLogin: boolean
  trigger: () => Promise<void>
  checkFirstLogin: () => Promise<void>
  completeMigration: (action: 'sync' | 'skip') => Promise<void>
  init: () => void
}

const supabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
}

const isElectron = () => !!(window as any).electronAPI

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSyncedAt: null,
  migrationCase: null,
  checkingFirstLogin: false,

  trigger: async () => {
    if (!isElectron()) return
    if (get().checkingFirstLogin) return

    const session = useAuthStore.getState().session
    if (!session) return

    set({ status: 'syncing' })
    try {
      const api = (window as any).electronAPI
      const result = await api.sync.trigger(session, supabaseConfig)
      set({ status: result.status, lastSyncedAt: result.lastSyncedAt })
    } catch (err) {
      console.error('[sync] trigger failed:', err)
      set({ status: 'error' })
    }
  },

  checkFirstLogin: async () => {
    if (!isElectron()) return

    const { session, user } = useAuthStore.getState()
    if (!session || !user) return

    set({ checkingFirstLogin: true })
    try {
      const api = (window as any).electronAPI
      const result = await api.sync.checkFirstLogin(user.id, session, supabaseConfig)

      if (!result.isFirstLogin) {
        // Returning user — run normal sync
        set({ checkingFirstLogin: false })
        await get().trigger()
        return
      }

      const { hasLocal, hasRemote } = result
      if (!hasLocal && !hasRemote) {
        // Neither side has data — mark done and do an initial sync
        // so future data gets pushed on the next trigger
        await api.sync.markFirstLoginDone(user.id)
        set({ checkingFirstLogin: false })
        await get().trigger()
      } else {
        const migrationCase: MigrationCase =
          hasLocal && hasRemote ? 'both' : hasLocal ? 'local-only' : 'cloud-only'
        set({ migrationCase, checkingFirstLogin: false })
      }
    } catch (err) {
      console.error('[sync] checkFirstLogin failed:', err)
      set({ checkingFirstLogin: false })
    }
  },

  completeMigration: async (action) => {
    const { session, user } = useAuthStore.getState()
    if (!user || !isElectron()) return

    const api = (window as any).electronAPI
    set({ migrationCase: null })

    if (action === 'sync' && session) {
      // trigger() will write to sync_meta when it completes
      await get().trigger()
    } else {
      await api.sync.markFirstLoginDone(user.id)
    }
  },

  init: () => {
    window.addEventListener('focus', () => {
      useSyncStore.getState().trigger()
    })

    useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn) {
        useSyncStore.getState().checkFirstLogin()
      }
    })
  }
}))
