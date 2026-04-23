import { App } from '@capacitor/app'
import { supabase } from './supabase'

/**
 * Call once at app startup on Capacitor (iOS + Android).
 * Listens for the reminders://auth/callback deep link that Supabase redirects to
 * after magic-link auth, then exchanges the code for a session.
 * Mirrors the Electron handler in src/main/auth.ts + auth.store.ts.
 *
 * The captcha callback (reminders://captcha) is handled by AccountSection, which
 * owns the UI state and must call sendMagicLink exactly once with the verified token.
 */
export function setupMobileAuth(): void {
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith('reminders://')) return

    const parsed = new URL(url)
    if (parsed.hostname === 'captcha') return

    const code = parsed.searchParams.get('code')
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }
  })
}
