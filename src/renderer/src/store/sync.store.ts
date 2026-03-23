import { create } from 'zustand'
import { useAuthStore } from './auth.store'

type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  trigger: () => Promise<void>
  init: () => void
}

const supabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,

  trigger: async () => {
    const session = useAuthStore.getState().session
    if (!session) return

    set({ status: 'syncing' })
    try {
      const api = (window as any).electronAPI
      const result = await api.sync.trigger(session, supabaseConfig)
      set({ status: result.status, lastSyncedAt: result.lastSyncedAt })
    } catch {
      set({ status: 'error' })
    }
  },

  init: () => {
    window.addEventListener('focus', () => {
      useSyncStore.getState().trigger()
    })

    useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn) {
        useSyncStore.getState().trigger()
      }
    })
  }
}))
