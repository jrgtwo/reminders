import posthog from 'posthog-js'
import { isAllowed, onConsentChange } from './consent'

function detectPlatform(): 'electron' | 'capacitor' | 'web' {
  if (typeof window === 'undefined') return 'web'
  if ((window as any).electronAPI) return 'electron'
  try {
    if ((window as any).Capacitor?.isNativePlatform?.()) return 'capacitor'
  } catch {}
  return 'web'
}

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'
const platform = detectPlatform()

let initialized = false

function initPostHog(): void {
  if (initialized || !key) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    person_profiles: 'identified_only'
  })
  posthog.register({ platform })
  initialized = true
}

function shutdownPostHog(): void {
  if (!initialized || !key) return
  posthog.opt_out_capturing()
  initialized = false
}

// Boot if consent already granted (e.g. returning user)
if (isAllowed('analytics')) {
  initPostHog()
}

// React to future consent changes
onConsentChange((state) => {
  if (state.analytics) {
    if (!initialized) {
      initPostHog()
    } else {
      posthog.opt_in_capturing()
    }
  } else {
    shutdownPostHog()
  }
})

export function identifyUser(userId: string): void {
  if (!key || !initialized) return
  posthog.identify(userId, { platform })
}

export function resetUser(): void {
  if (!key || !initialized) return
  posthog.reset()
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!key || !initialized) return
  posthog.capture(event, properties)
}
