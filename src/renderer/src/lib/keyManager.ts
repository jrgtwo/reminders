import { supabase } from './supabase'
import { generateKey, exportKey, importKey } from './encryption'

let encryptionKey: CryptoKey | null = null

async function hashKeyData(keyData: string): Promise<string> {
  const encoded = new TextEncoder().encode(keyData)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Tracks whether the Supabase key differs from the locally-cached fingerprint.
// Consumed (and reset) by webSync to wipe stale local data before a fresh pull.
const _keyChangedForUser = new Map<string, boolean>()

export function wasEncryptionKeyChanged(userId: string): boolean {
  return _keyChangedForUser.get(userId) ?? false
}

export function clearEncryptionKeyChangedFlag(userId: string): void {
  _keyChangedForUser.delete(userId)
}

const KEY_FP_KEY = (userId: string) => `enc_key_fp_${userId}`
const LAST_USER_KEY = 'enc_last_user_id'

export function getEncryptionKey(): CryptoKey | null {
  return encryptionKey
}

/**
 * Try to restore the encryption key from local cache using the last-known userId.
 * Called during app init before auth completes, so previously-encrypted data
 * can be decrypted immediately without waiting for a network round-trip.
 */
export async function tryRestoreCachedKey(): Promise<void> {
  if (encryptionKey) return // already loaded
  try {
    const userId = localStorage.getItem(LAST_USER_KEY)
    if (!userId) return
    const cached = await loadCachedKey(userId)
    if (cached) encryptionKey = cached
  } catch {}
}

export function setEncryptionKey(key: CryptoKey): void {
  encryptionKey = key
}

export { cacheKeyLocally as cacheKey }

async function loadCachedKey(userId: string): Promise<CryptoKey | null> {
  try {
    const api = (window as any).electronAPI
    if (api?.safeStorage) {
      const b64 = await api.safeStorage.loadKey(userId)
      if (b64) return importKey(b64)
    } else {
      const b64 = localStorage.getItem(`enc_key_${userId}`)
      if (b64) return importKey(b64)
    }
  } catch {}
  return null
}

async function cacheKeyLocally(userId: string, b64: string): Promise<void> {
  try {
    const api = (window as any).electronAPI
    if (api?.safeStorage) {
      await api.safeStorage.saveKey(userId, b64)
    } else {
      localStorage.setItem(`enc_key_${userId}`, b64)
    }
  } catch {}
}

async function clearCachedKey(userId: string): Promise<void> {
  try {
    const api = (window as any).electronAPI
    if (api?.safeStorage) {
      await api.safeStorage.clearKey(userId)
    } else {
      localStorage.removeItem(`enc_key_${userId}`)
    }
  } catch {}
}

export async function initEncryptionKey(userId: string): Promise<void> {
  try {
    // Always fetch from Supabase first — it's the source of truth across devices.
    const { data, error: fetchError } = await supabase
      .from('user_keys')
      .select('key_data')
      .eq('user_id', userId)
      .single()

    if (data?.key_data) {
      const keyHash = await hashKeyData(data.key_data)
      const prevFp = localStorage.getItem(KEY_FP_KEY(userId))
      _keyChangedForUser.set(userId, prevFp !== null && prevFp !== keyHash)
      localStorage.setItem(KEY_FP_KEY(userId), keyHash)
      localStorage.setItem(LAST_USER_KEY, userId)
      encryptionKey = await importKey(data.key_data)
      await cacheKeyLocally(userId, data.key_data)
      return
    }

    // PGRST116 = no rows — safe to generate a new key.
    // Any other error (schema mismatch, RLS, etc.) is a real problem — bail out.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[encryption] Failed to fetch key from Supabase:', fetchError.message)
      throw fetchError
    }

    // No key exists yet — generate one and insert it.
    const key = await generateKey()
    const keyData = await exportKey(key)

    const { error: insertError } = await supabase
      .from('user_keys')
      .insert({ user_id: userId, key_data: keyData })

    if (insertError) {
      // Insert failed — most likely a concurrent insert from another device.
      // Re-fetch the key that was inserted instead.
      console.warn('[encryption] Insert failed, re-fetching key:', insertError.message)
      const { data: retryData } = await supabase
        .from('user_keys')
        .select('key_data')
        .eq('user_id', userId)
        .single()

      if (retryData?.key_data) {
        encryptionKey = await importKey(retryData.key_data)
        await cacheKeyLocally(userId, retryData.key_data)
        return
      }

      // Still nothing — log and leave key null so app works unencrypted.
      console.error('[encryption] Could not establish encryption key.')
      return
    }

    localStorage.setItem(LAST_USER_KEY, userId)
    encryptionKey = key
    await cacheKeyLocally(userId, keyData)
  } catch {
    // Network unavailable — fall back to local cache so offline use still works.
    const cached = await loadCachedKey(userId)
    if (cached) encryptionKey = cached
  }
}

export async function clearEncryptionKey(userId: string): Promise<void> {
  encryptionKey = null
  localStorage.removeItem(LAST_USER_KEY)
  await clearCachedKey(userId)
}
