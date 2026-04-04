import type { IStorageAdapter } from './types'
import { EncryptedAdapter } from './encryptedAdapter'
import { getEncryptionKey } from '../lib/keyManager'

let innerAdapter: IStorageAdapter | null = null
let encryptedAdapter: EncryptedAdapter | null = null

export async function initStorage(): Promise<void> {
  if (innerAdapter) return

  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const { ElectronAdapter } = await import('./electron')
    innerAdapter = new ElectronAdapter()
  } else {
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        const { CapacitorAdapter } = await import('./capacitor')
        innerAdapter = new CapacitorAdapter()
      }
    } catch {
      // @capacitor/core not available — running in plain web
    }

    if (!innerAdapter) {
      const { WebAdapter } = await import('./web')
      const web = new WebAdapter()
      await web.init()
      innerAdapter = web
    }
  }

  encryptedAdapter = new EncryptedAdapter(innerAdapter, getEncryptionKey)
}

/** Encrypted adapter — use this everywhere in the UI / Zustand stores. */
export function getStorage(): IStorageAdapter {
  if (!encryptedAdapter) throw new Error('Storage not initialized — call initStorage() first')
  return encryptedAdapter
}

/**
 * Raw (unencrypted) adapter — used only by sync code so that ciphertext is
 * moved to/from Supabase as-is without double-encrypting or decrypting.
 */
export function getRawStorage(): IStorageAdapter {
  if (!innerAdapter) throw new Error('Storage not initialized — call initStorage() first')
  return innerAdapter
}
