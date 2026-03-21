import type { IStorageAdapter } from './types'

let adapter: IStorageAdapter | null = null

export async function initStorage(): Promise<IStorageAdapter> {
  if (adapter) return adapter

  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const { ElectronAdapter } = await import('./electron')
    adapter = new ElectronAdapter()
    return adapter
  }

  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { CapacitorAdapter } = await import('./capacitor')
      adapter = new CapacitorAdapter()
      return adapter
    }
  } catch {
    // @capacitor/core not available — running in plain web
  }

  const { WebAdapter } = await import('./web')
  const web = new WebAdapter()
  await web.init()
  adapter = web
  return adapter
}

export function getStorage(): IStorageAdapter {
  if (!adapter) throw new Error('Storage not initialized — call initStorage() first')
  return adapter
}