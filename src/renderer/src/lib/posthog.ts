import posthog from 'posthog-js'

function detectPlatform(): 'electron' | 'capacitor' | 'web' {
  if (typeof window === 'undefined') return 'web'
  if ((window as any).electronAPI) return 'electron'
  try {
    if ((window as any).Capacitor?.isNativePlatform?.()) return 'capacitor'
  } catch {}
  return 'web'
}

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'
const platform = detectPlatform()

if (key) {
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    person_profiles: 'identified_only',
  })
  posthog.register({ platform })
}

export function identifyUser(userId: string): void {
  if (!key) return
  posthog.identify(userId, { platform })
}

export function resetUser(): void {
  if (!key) return
  posthog.reset()
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!key) return
  posthog.capture(event, properties)
}
