/**
 * Hands credentials from the renderer to the background runner via dispatchEvent.
 *
 * The background runner runs in a separate JS context (JSCore on iOS, JS engine on
 * Android) with no access to the renderer's localStorage. It needs the user's
 * encryption key + Supabase tokens to sync and decrypt reminders. The runner-side
 * `setCredentials` event handler writes these into CapacitorKV.
 *
 * The caller is responsible for invoking setCredentials() after sign-in / token refresh.
 * setupForegroundResync() re-fires the cached credentials on every app foreground —
 * self-heals the first-launch race where the runner may not yet be registered with
 * the OS the first time setCredentials is called.
 */

const RUNNER_LABEL = 'com.remindertoday.app.sync'

export interface RunnerCredentials {
  user_id: string
  enc_key: string
  access_token: string
  refresh_token: string
  expires_at: number
  supabase_url: string
  supabase_anon_key: string
}

let cached: RunnerCredentials | null = null
let foregroundListenerSetup = false

async function dispatch(event: string, details: Record<string, unknown>): Promise<void> {
  try {
    const { BackgroundRunner } = await import('@capacitor/background-runner')
    await BackgroundRunner.dispatchEvent({ label: RUNNER_LABEL, event, details })
  } catch (err) {
    // Plugin not available (web/Electron) or runner not yet registered — silently ignore.
    // setupForegroundResync() will retry on the next app foreground.
    console.warn('[runnerBridge] dispatchEvent failed:', err)
  }
}

export async function setCredentials(creds: RunnerCredentials): Promise<void> {
  cached = creds
  await dispatch('setCredentials', { ...creds })
}

export async function clearCredentials(): Promise<void> {
  cached = null
  await dispatch('clearCredentials', {})
}

export interface RunnerDebugInfo {
  last_run_at: string
  last_run_error: string
  last_synced_count: string
  has_credentials: boolean
}

export async function getDebugInfo(): Promise<RunnerDebugInfo | null> {
  try {
    const { BackgroundRunner } = await import('@capacitor/background-runner')
    return (await BackgroundRunner.dispatchEvent({
      label: RUNNER_LABEL,
      event: 'getDebugInfo',
      details: {},
    })) as RunnerDebugInfo
  } catch (err) {
    console.warn('[runnerBridge] getDebugInfo failed:', err)
    return null
  }
}

/**
 * Attach an app-foreground listener that re-fires the cached credentials.
 * Idempotent — safe to call from multiple init paths.
 */
export async function setupForegroundResync(): Promise<void> {
  if (foregroundListenerSetup) return
  foregroundListenerSetup = true
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && cached) {
        dispatch('setCredentials', { ...cached }).catch(() => {})
      }
    })
  } catch {
    // @capacitor/app not available — running in plain web or Electron
  }
}
