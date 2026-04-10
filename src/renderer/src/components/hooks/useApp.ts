import { useEffect, useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuthStore } from '../../store/auth.store'
import { identifyUser, resetUser } from '../../lib/analytics'
import { useSyncStore } from '../../store/sync.store'
import { useUIStore } from '../../store/ui.store'
import { initStorage } from '../../platform'

export function useApp(router: { navigate: (path: string) => void }) {
  const [ready, setReady] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const initAuth = useAuthStore((s) => s.init)
  const initSync = useSyncStore((s) => s.init)
  useNotifications()

  useEffect(() => {
    setTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    initStorage()
      .then(async () => {
        try {
          const { Capacitor } = await import('@capacitor/core')
          if (Capacitor.isNativePlatform()) {
            const { requestNotificationPermission } = await import('../../lib/mobileNotifications')
            await requestNotificationPermission()
          }
        } catch {
          // not a Capacitor build
        }
        setReady(true)
      })
      .catch(() => setReady(true))
    initAuth()
      .then(() => setAuthReady(true))
      .catch((err) => {
        console.error('[auth] init failed:', err)
        setAuthReady(true) // unblock the render — isLoggedIn will be false, showing SignInPage
      })
    initSync()
  }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onNavigate) return
    api.onNavigate((path: string) => router.navigate(path))
  }, [])

  useEffect(() => {
    return useAuthStore.subscribe((state, prev) => {
      if (!prev.isLoggedIn && state.isLoggedIn && state.user) {
        identifyUser(state.user.id)
      }
      if (prev.isLoggedIn && !state.isLoggedIn) {
        resetUser()
      }
    })
  }, [])

  return {
    ready,
    authReady,
    isLoggedIn
  }
}
