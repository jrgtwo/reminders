import { createClient } from '@supabase/supabase-js'
import { getNativeAuthStorage } from './supabaseStorage'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      storage: getNativeAuthStorage(),
      storageKey: 'sb-reminder-today-auth',
    },
  }
)
