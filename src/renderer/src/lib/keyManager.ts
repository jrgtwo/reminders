import { supabase } from './supabase'
import { generateKey, exportKey, importKey } from './encryption'

let encryptionKey: CryptoKey | null = null

export function getEncryptionKey(): CryptoKey | null {
  return encryptionKey
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
  // 1. Try local cache first — works offline
  const cached = await loadCachedKey(userId)
  if (cached) {
    encryptionKey = cached
    return
  }

  // 2. Fetch from Supabase
  const { data } = await supabase
    .from('user_keys')
    .select('key_data')
    .eq('user_id', userId)
    .single()

  if (data?.key_data) {
    encryptionKey = await importKey(data.key_data)
    await cacheKeyLocally(userId, data.key_data)
    return
  }

  // 3. First login — generate, store in Supabase, cache locally
  const key = await generateKey()
  const keyData = await exportKey(key)
  await supabase.from('user_keys').insert({ user_id: userId, key_data: keyData })
  encryptionKey = key
  await cacheKeyLocally(userId, keyData)
}

export async function clearEncryptionKey(userId: string): Promise<void> {
  encryptionKey = null
  await clearCachedKey(userId)
}
