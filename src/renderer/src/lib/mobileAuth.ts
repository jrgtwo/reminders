import { App } from '@capacitor/app'
import { supabase } from './supabase'

/**
 * Call once at app startup on Capacitor (iOS + Android).
 * Listens for the reminders://callback deep link that Supabase redirects to
 * after magic-link auth, then exchanges the code for a session.
 * Mirrors the Electron handler in src/main/auth.ts + auth.store.ts.
 */
export function setupMobileAuth(): void {
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith('reminders://')) return

    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')

    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    } else {
      const hash = new URLSearchParams(parsed.hash.substring(1))
      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
      }
    }
  })
}
