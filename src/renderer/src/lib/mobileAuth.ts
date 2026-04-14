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
    }
  })
}
