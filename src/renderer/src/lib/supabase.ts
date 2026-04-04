import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      // Prevent the constructor from auto-initializing in parallel with our own
      // getSession() call in auth.store.ts. Without this, both compete for the
      // same navigator.locks entry, and the constructor's rejected initializePromise
      // poisons all subsequent getSession() calls.
      skipAutoInitialize: true,
    },
  }
)
