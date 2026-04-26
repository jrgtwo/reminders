import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { capture } from '../lib/analytics'
import { initEncryptionKey, clearEncryptionKey, getCachedKeyBase64 } from '../lib/keyManager'
import {
  setCredentials as setRunnerCredentials,
  clearCredentials as clearRunnerCredentials,
  setupForegroundResync,
} from '../lib/runnerBridge'

async function pushCredentialsToRunner(session: Session): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    if (!session.access_token || !session.refresh_token) return
    const encKey = await getCachedKeyBase64(session.user.id)
    if (!encKey) return
    await setRunnerCredentials({
      user_id: session.user.id,
      enc_key: encKey,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at ?? 0,
      supabase_url: import.meta.env.VITE_SUPABASE_URL as string,
      supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    })
  } catch (err) {
    console.warn('[auth] failed to push credentials to runner:', err)
  }
}

type Plan = 'free' | 'pro' | 'comp'

interface AuthState {
  user: User | null
  session: Session | null
  isLoggedIn: boolean
  plan: Plan
  init: () => Promise<void>
  sendMagicLink: (email: string, captchaToken?: string) => Promise<void>
  checkIsReviewerAccount: (email: string) => Promise<boolean>
  signInWithPassword: (email: string, password: string, captchaToken?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoggedIn: false,
  plan: 'free',

  init: () => {
    // Restore existing session on app launch
    const sessionReady = supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await initEncryptionKey(session.user.id).catch(console.error)
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', session.user.id)
          .single()
        set({
          session,
          user: session.user,
          isLoggedIn: true,
          plan: (profile?.plan as Plan) ?? 'free',
        })
        pushCredentialsToRunner(session).catch(console.error)
      } else {
        set({ session, user: null, isLoggedIn: false, plan: 'free' })
      }
    })

    // Re-fire credentials to the runner on every app foreground (Capacitor only).
    // Self-heals the first-launch race where the runner may not yet be registered with the OS.
    setupForegroundResync().catch(() => {})

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
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('user_id', session.user.id)
            .single()
          set({
            session,
            user: session.user,
            isLoggedIn: true,
            plan: (profile?.plan as Plan) ?? 'free',
          })
          pushCredentialsToRunner(session).catch(console.error)
        } else {
          set({ session, user: null, isLoggedIn: false, plan: 'free' })
        }
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
        }
      })
    }

    // Capacitor (iOS + Android): receive deep-link OAuth callback via appUrlOpen
    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import('../lib/mobileAuth').then(({ setupMobileAuth }) => setupMobileAuth())
        }
      })
      .catch(() => {
        // @capacitor/core not available — running in plain web or Electron
      })

    return sessionReady
  },

  sendMagicLink: async (email, captchaToken) => {
    const isElectron = !!(window as any).electronAPI
    let isNative = false
    try {
      const { Capacitor } = await import('@capacitor/core')
      isNative = Capacitor.isNativePlatform()
    } catch {
      // not available
    }
    const redirectTo =
      isElectron || isNative ? 'reminders://auth/callback' : window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, captchaToken },
    })
    if (error) throw error
    capture('auth_magic_link_sent')
  },

  checkIsReviewerAccount: async (email) => {
    const { data, error } = await supabase.rpc('is_reviewer_email', { p_email: email })
    if (error) return false
    return data === true
  },

  signInWithPassword: async (email, password, captchaToken) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })
    if (error) throw error
    capture('auth_password_sign_in')
  },

  signOut: async () => {
    capture('auth_signed_out')
    const userId = useAuthStore.getState().user?.id
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoggedIn: false, plan: 'free' })
    if (userId) await clearEncryptionKey(userId)
    clearRunnerCredentials().catch(console.error)
  },
}))
