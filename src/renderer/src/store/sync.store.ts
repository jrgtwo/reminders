import { create } from 'zustand'
import { useAuthStore } from './auth.store'
import { useRemindersStore } from './reminders.store'
import { useNotesStore } from './notes.store'
import { useTodosStore } from './todos.store'
import { webSync, webCheckFirstLogin, webMarkFirstLoginDone } from '../lib/webSync'
import { capture } from '../lib/analytics'

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
    if (get().checkingFirstLogin) return

    const session = useAuthStore.getState().session
    if (!session) return

    set({ status: 'syncing' })
    try {
      let result: { status?: string; lastSyncedAt: string }
      if (isElectron()) {
        const api = (window as any).electronAPI
        result = await api.sync.trigger(session, supabaseConfig)
      } else {
        result = await webSync(session)
      }
      set({ status: 'idle', lastSyncedAt: result.lastSyncedAt })
      capture('sync_completed', { last_synced_at: result.lastSyncedAt })
      await Promise.all([
        useRemindersStore.getState().load(),
        useNotesStore.getState().loadNoteDates(),
        useTodosStore.getState().load(),
      ])
    } catch (err) {
      console.error('[sync] trigger failed:', err)
      const isNetworkError =
        !navigator.onLine ||
        (err instanceof TypeError && err.message.toLowerCase().includes('fetch'))
      set({ status: isNetworkError ? 'idle' : 'error' })
    }
  },

  checkFirstLogin: async () => {
    const { session, user } = useAuthStore.getState()
    if (!session || !user) return

    set({ checkingFirstLogin: true })
    try {
      let result: { isFirstLogin: boolean; hasLocal: boolean; hasRemote: boolean }
      if (isElectron()) {
        const api = (window as any).electronAPI
        result = await api.sync.checkFirstLogin(user.id, session, supabaseConfig)
      } else {
        result = await webCheckFirstLogin(user.id)
      }

      if (!result.isFirstLogin) {
        set({ checkingFirstLogin: false })
        await get().trigger()
        return
      }

      const { hasLocal, hasRemote } = result
      if (!hasLocal && !hasRemote) {
        if (isElectron()) {
          const api = (window as any).electronAPI
          await api.sync.markFirstLoginDone(user.id)
        } else {
          webMarkFirstLoginDone(user.id)
        }
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
    if (!user) return

    capture('sync_first_login_migration', { action, migration_case: get().migrationCase })
    set({ migrationCase: null })

    if (action === 'sync' && session) {
      await get().trigger()
    } else {
      if (isElectron()) {
        const api = (window as any).electronAPI
        await api.sync.markFirstLoginDone(user.id)
      } else {
        webMarkFirstLoginDone(user.id)
      }
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
