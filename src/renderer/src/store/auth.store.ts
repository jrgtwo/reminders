import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
    const sessionReady = supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoggedIn: !!session })
    })

    // Keep store in sync with Supabase auth state changes
    supabase.auth.onAuthStateChange((_, session) => {
      set({ session, user: session?.user ?? null, isLoggedIn: !!session })
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
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoggedIn: false })
  },
}))
