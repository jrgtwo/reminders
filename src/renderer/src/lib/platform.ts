export function isNativePlatform(): boolean {
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

export function isWebPlatform(): boolean {
  if (typeof window === 'undefined') return false
  return !isNativePlatform()
}
