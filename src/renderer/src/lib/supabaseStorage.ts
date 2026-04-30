/**
 * Supabase auth-session storage adapter for Capacitor (Android/iOS).
 *
 * Default Supabase clients persist sessions in WebView localStorage. On Android that storage
 * is not durable — System WebView updates, OS storage pressure, and aggressive OEM memory
 * managers can wipe it, causing silent auto-logouts. Preferences uses Android
 * SharedPreferences / iOS UserDefaults, which survive across all of those.
 *
 * Web and Electron builds get `undefined` from getNativeAuthStorage() and fall back to
 * Supabase's default localStorage (fine — Electron's localStorage lives in the persistent
 * userData profile).
 *
 * Resilience: every Preferences call is wrapped in a short timeout, and we keep a redundant
 * localStorage copy. If the Capacitor bridge ever fails to respond, app init still completes
 * and the user is no worse off than before this adapter existed.
 */

import { Preferences } from '@capacitor/preferences'

interface SupabaseAuthStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

const STORAGE_TIMEOUT_MS = 2000

function isCapacitorNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform()
}

/**
 * Resolve with the promise's value, or with `fallback` if it doesn't settle within the
 * timeout (or rejects). Never rejects — guarantees app init can't be deadlocked by a stuck
 * native bridge call.
 */
function withTimeout<T>(p: Promise<T>, fallback: T, label: string): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      console.warn(`[supabaseStorage] ${label} timed out after ${STORAGE_TIMEOUT_MS}ms`)
      resolve(fallback)
    }, STORAGE_TIMEOUT_MS)
    p.then(
      (v) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(v)
      },
      (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        console.warn(`[supabaseStorage] ${label} failed:`, err)
        resolve(fallback)
      }
    )
  })
}

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Quota / privacy mode — ignore.
  }
}

function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

const nativeAuthStorage: SupabaseAuthStorage = {
  async getItem(key) {
    const result = await withTimeout(
      Preferences.get({ key }),
      { value: null as string | null },
      `getItem(${key})`
    )
    if (result.value !== null) return result.value
    // Either Preferences had nothing, or the call timed out / errored. In both cases, fall
    // through to localStorage. If localStorage has a value, mirror it into Preferences so
    // the next read finds it directly (one-shot migration from the prior backend, also
    // self-healing if Preferences gets cleared independently).
    const legacy = readLocal(key)
    if (legacy !== null) {
      withTimeout(Preferences.set({ key, value: legacy }), undefined, `setItem(${key})`).catch(
        () => {}
      )
    }
    return legacy
  },
  async setItem(key, value) {
    writeLocal(key, value)
    await withTimeout(Preferences.set({ key, value }), undefined, `setItem(${key})`)
  },
  async removeItem(key) {
    removeLocal(key)
    await withTimeout(Preferences.remove({ key }), undefined, `removeItem(${key})`)
  }
}

export function getNativeAuthStorage(): SupabaseAuthStorage | undefined {
  return isCapacitorNative() ? nativeAuthStorage : undefined
}
