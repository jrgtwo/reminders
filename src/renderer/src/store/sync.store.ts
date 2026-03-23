import { create } from 'zustand'
import { useAuthStore } from './auth.store'

type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  trigger: () => Promise<void>
  init: () => void
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
      const result = await api.sync.trigger(session)
      set({ status: result.status, lastSyncedAt: result.lastSyncedAt })
    } catch {
      set({ status: 'error' })
    }
  },

  init: () => {
    // Sync when the window regains focus
    window.addEventListener('focus', () => {
      useSyncStore.getState().trigger()
    })

    // Sync whenever the user signs in
    useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn) {
        useSyncStore.getState().trigger()
      }
    })
  }
}))
