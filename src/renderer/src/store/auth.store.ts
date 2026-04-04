import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { capture } from '../lib/analytics'
import { initEncryptionKey, clearEncryptionKey } from '../lib/keyManager'

interface AuthState {
  user: User | null
  session: Session | null
  isLoggedIn: boolean
  init: () => Promise<void>
  sendMagicLink: (email: string, captchaToken: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoggedIn: false,

  init: () => {
    // Restore existing session on app launch
    const sessionReady = supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await initEncryptionKey(session.user.id).catch(console.error)
      }
      set({ session, user: session?.user ?? null, isLoggedIn: !!session })
    })

    // Keep store in sync with future auth state changes (sign-in, sign-out, token refresh).
    //
    // IMPORTANT: this callback must NOT be async and must not await network calls.
    // Supabase fires it from within _notifyAllSubscribers, which runs inside the
    // navigator.locks auth lock. Awaiting a network call (like initEncryptionKey)
    // holds the lock for the full round-trip duration. Any other tab or concurrent
    // operation waiting for the same lock will time out after 5 s and steal it,
    // causing "lock was released because another request stole it" errors.
    //
    // Solution: schedule the async work via setTimeout so it runs after the lock
    // is released. isLoggedIn is only set after the key is ready, preserving the
    // invariant that the sync store never decrypts before the key is available.
    supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION fires during initialization — already handled by getSession().then() above.
      if (event === 'INITIAL_SESSION') return

      setTimeout(async () => {
        if (session?.user) {
          await initEncryptionKey(session.user.id).catch(console.error)
        }
        set({ session, user: session?.user ?? null, isLoggedIn: !!session })
      }, 0)
    })

    // Electron: receive deep-link OAuth callback from main process
    const api = (window as any).electronAPI
    if (api?.auth?.onCallback) {
      api.auth.onCallback(async (callbackUrl: string) => {
        const url = new URL(callbackUrl)
        // PKCE flow: Supabase sends back a `code` query param
        const code = url.searchParams.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        } else {
          // Implicit flow fallback: tokens in the URL hash
          const hash = new URLSearchParams(url.hash.substring(1))
          const access_token = hash.get('access_token')
          const refresh_token = hash.get('refresh_token')
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
          }
        }
      })
    }

    return sessionReady
  },

  sendMagicLink: async (email, captchaToken) => {
    const isElectron = !!(window as any).electronAPI
    const redirectTo = isElectron ? 'reminders://auth/callback' : window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, captchaToken },
    })
    if (error) throw error
    capture('auth_magic_link_sent')
  },

  signOut: async () => {
    capture('auth_signed_out')
    const userId = useAuthStore.getState().user?.id
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoggedIn: false })
    if (userId) await clearEncryptionKey(userId)
  },
}))
