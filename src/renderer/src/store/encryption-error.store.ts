import { create } from 'zustand'

interface EncryptionErrorState {
  hasError: boolean
  dismissed: boolean
  setError: () => void
  dismiss: () => void
  clear: () => void
}

export const useEncryptionErrorStore = create<EncryptionErrorState>((set) => ({
  hasError: false,
  dismissed: false,
  setError: () => set({ hasError: true, dismissed: false }),
  dismiss: () => set({ dismissed: true }),
  clear: () => set({ hasError: false, dismissed: false }),
}))
