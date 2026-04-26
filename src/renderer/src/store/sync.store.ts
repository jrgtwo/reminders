import { create } from 'zustand'
import { useAuthStore } from './auth.store'
import { useRemindersStore } from './reminders.store'
import { useNotesStore } from './notes.store'
import { useNoteFoldersStore } from './note_folders.store'
import { useTodoListsStore } from './todo_lists.store'
import {
  webSync,
  webCheckFirstLogin,
  webMarkFirstLoginDone,
  webResetFromCloud
} from '../lib/webSync'
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
  completeMigration: (action: 'sync' | 'skip', remember?: boolean) => Promise<void>
  /** Wipe local DB and pull a fresh copy from the cloud. */
  resetFromCloud: () => Promise<void>
  /** Wipe local DB without syncing. Next sync will do a full pull. */
  clearLocalData: () => Promise<void>
  init: () => void
}

const supabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string
}

const isElectron = () => !!(window as any).electronAPI

const SYNC_INTERVAL_MS = 30_000 // poll every 30s while tab is visible
const SYNC_COOLDOWN_MS = 15_000 // skip visibility trigger if last sync was recent

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSyncedAt: null,
  migrationCase: null,
  checkingFirstLogin: false,

  trigger: async () => {
    if (get().checkingFirstLogin) return
    if (get().status === 'syncing') return

    const { session, plan } = useAuthStore.getState()
    if (!session) return
    if (plan !== 'pro' && plan !== 'comp') return

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
        useNotesStore.getState().loadNotes(),
        useNoteFoldersStore.getState().load(),
        useTodoListsStore.getState().load()
      ])

      // Reconcile the OS notification queue against the freshly synced reminders
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { reconcileNotifications } = await import('../lib/mobileNotifications')
          reconcileNotifications(useRemindersStore.getState().reminders).catch(console.error)
        }
      } catch {
        // not a Capacitor build
      }
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

        const savedPref = localStorage.getItem(`reminder_migration_pref_${user.id}`)
        if (savedPref === 'sync' || savedPref === 'skip') {
          set({ checkingFirstLogin: false })
          await get().completeMigration(savedPref)
          return
        }

        set({ migrationCase, checkingFirstLogin: false })
      }
    } catch (err) {
      console.error('[sync] checkFirstLogin failed:', err)
      set({ checkingFirstLogin: false })
    }
  },

  resetFromCloud: async () => {
    const { session, user } = useAuthStore.getState()
    if (!session || !user) return
    // Don't use get().status guard here — we manage status ourselves
    if (get().status === 'syncing') return

    set({ status: 'syncing' })
    try {
      if (!isElectron()) {
        // webResetFromCloud: clears local, full pull, no push.
        // Skipping push ensures records deleted from Supabase aren't re-created.
        const result = await webResetFromCloud(session)
        set({ status: 'idle', lastSyncedAt: result.lastSyncedAt })
      } else {
        set({ status: 'idle' })
      }
      await Promise.all([
        useRemindersStore.getState().load(),
        useNotesStore.getState().loadNotes(),
        useNoteFoldersStore.getState().load(),
        useTodoListsStore.getState().load()
      ])

      // Reconcile the OS notification queue against the freshly pulled reminders
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { reconcileNotifications } = await import('../lib/mobileNotifications')
          reconcileNotifications(useRemindersStore.getState().reminders).catch(console.error)
        }
      } catch {
        // not a Capacitor build
      }
    } catch (err) {
      console.error('[sync] resetFromCloud failed:', err)
      set({ status: 'error' })
    }
  },

  clearLocalData: async () => {
    const { user } = useAuthStore.getState()
    try {
      if (!isElectron()) {
        const { initStorage, getRawStorage } = await import('../platform')
        await initStorage()
        const adapter = getRawStorage()
        if (adapter.clearAll) await adapter.clearAll()
        // Reset lastPullAt so the next sync does a full pull.
        // Keep FIRST_LOGIN_KEY so the merge dialog doesn't reappear.
        if (user) localStorage.removeItem(`sync_last_pull_${user.id}`)
      }
      await Promise.all([
        useRemindersStore.getState().load(),
        useNotesStore.getState().loadNotes(),
        useNoteFoldersStore.getState().load(),
        useTodoListsStore.getState().load()
      ])
    } catch (err) {
      console.error('[sync] clearLocalData failed:', err)
    }
  },

  completeMigration: async (action, remember = false) => {
    const { session, user } = useAuthStore.getState()
    if (!user) return

    if (remember) {
      localStorage.setItem(`reminder_migration_pref_${user.id}`, action)
    }

    capture('sync_first_login_migration', { action, migration_case: get().migrationCase })
    set({ migrationCase: null })

    // Always mark first login done so the dialog doesn't reappear
    if (isElectron()) {
      const api = (window as any).electronAPI
      await api.sync.markFirstLoginDone(user.id)
    } else {
      webMarkFirstLoginDone(user.id)
    }

    if (action === 'sync' && session) {
      await get().trigger()
    }
  },

  init: () => {
    // Periodic sync while tab is visible
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        useSyncStore.getState().trigger()
      }
    }, SYNC_INTERVAL_MS)

    // Immediate sync on tab focus — skip if last sync was recent
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      const last = useSyncStore.getState().lastSyncedAt
      const elapsed = last ? Date.now() - new Date(last).getTime() : Infinity
      if (elapsed >= SYNC_COOLDOWN_MS) {
        useSyncStore.getState().trigger()
      }
    })

    useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn) {
        useSyncStore.getState().checkFirstLogin()
      }
    })
  }
}))
