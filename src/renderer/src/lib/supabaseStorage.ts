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
 */

interface SupabaseAuthStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

function isCapacitorNative(): boolean {
  const cap = (window as any)?.Capacitor
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform()
}

async function getPreferences() {
  const { Preferences } = await import('@capacitor/preferences')
  return Preferences
}

const nativeAuthStorage: SupabaseAuthStorage = {
  async getItem(key) {
    const Preferences = await getPreferences()
    const { value } = await Preferences.get({ key })
    if (value !== null) return value
    // One-shot migration from the prior localStorage-backed session — populates Preferences
    // on first read so users currently signed in via the old backend don't get bounced out.
    const legacy = window.localStorage.getItem(key)
    if (legacy !== null) {
      await Preferences.set({ key, value: legacy })
      return legacy
    }
    return null
  },
  async setItem(key, value) {
    const Preferences = await getPreferences()
    await Preferences.set({ key, value })
  },
  async removeItem(key) {
    const Preferences = await getPreferences()
    await Preferences.remove({ key })
  },
}

export function getNativeAuthStorage(): SupabaseAuthStorage | undefined {
  return isCapacitorNative() ? nativeAuthStorage : undefined
}
