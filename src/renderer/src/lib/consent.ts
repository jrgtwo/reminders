/**
 * Lightweight cookie/tracking consent manager.
 *
 * Categories:
 *  - functional  — cookies/storage required for the app to work (landing-seen, theme, etc.)
 *  - analytics   — PostHog, Vercel Analytics, page-view tracking
 *
 * Consent state is stored in localStorage (not a cookie) so it works even when
 * all cookies are declined. On Electron/Capacitor the banner is never shown and
 * all categories default to granted (no cookies are set in native apps).
 */

const STORAGE_KEY = 'reminder_consent'

export type ConsentCategory = 'functional' | 'analytics'

export interface ConsentState {
  /** Has the user made an explicit choice? */
  decided: boolean
  functional: boolean
  analytics: boolean
}

type Listener = (state: ConsentState) => void

const listeners: Listener[] = []

const DEFAULT_STATE: ConsentState = {
  decided: false,
  functional: true,
  analytics: false
}

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).electronAPI) return true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Capacitor?.isNativePlatform?.()) return true
  } catch {
    // ignore
  }
  return false
}

/** Read persisted consent, falling back to defaults. */
export function getConsent(): ConsentState {
  // Native platforms: everything granted, no banner needed
  if (isNativePlatform()) {
    return { decided: true, functional: true, analytics: true }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ConsentState
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE }
}

/** Persist consent choices and notify listeners. */
export function setConsent(choices: Partial<Pick<ConsentState, ConsentCategory>>): void {
  const current = getConsent()
  const next: ConsentState = {
    ...current,
    ...choices,
    functional: true, // functional can never be turned off
    decided: true
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((fn) => fn(next))
}

/** Accept all categories. */
export function acceptAll(): void {
  setConsent({ functional: true, analytics: true })
}

/** Reject everything except functional. */
export function rejectNonEssential(): void {
  setConsent({ analytics: false })
}

/** Check whether a specific category is currently allowed. */
export function isAllowed(category: ConsentCategory): boolean {
  return getConsent()[category]
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(fn: Listener): () => void {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}
