import { useEffect, useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuthStore } from '../../store/auth.store'
import { useRemindersStore } from '../../store/reminders.store'
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
            const {
              requestNotificationPermission,
              registerNotificationActions,
              listenForNotificationActions,
              snoozeNotification,
              reconcileNotifications,
            } = await import('../../lib/mobileNotifications')
            await requestNotificationPermission()
            await registerNotificationActions()
            await listenForNotificationActions(
              async (reminderId) => {
                const reminders = useRemindersStore.getState().reminders
                const reminder = reminders.find((r) => r.id === reminderId)
                if (reminder) await snoozeNotification(reminder)
              },
              (reminderId, date) => {
                useRemindersStore.getState().toggleComplete(reminderId, date)
              },
            )
            // Recover from cases where the OS dropped pending alarms (reboot, app update,
            // force-stop, "Clear data"). Loads reminders from local storage first so the
            // reconcile sees the full set even before sync runs.
            useRemindersStore
              .getState()
              .load()
              .then(() => reconcileNotifications(useRemindersStore.getState().reminders))
              .catch(console.error)
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
    let cleanup: (() => void) | undefined
    import('@capacitor/core').then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', () => {
          router.navigate(-1 as any)
        }).then((handle) => {
          cleanup = () => handle.remove()
        })
      })
    }).catch(() => {})
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    import('@capacitor/core').then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return
      Promise.all([
        import('@capacitor/app'),
        import('../../lib/mobileNotifications'),
      ]).then(([{ App }, { reconcileNotifications }]) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) return
          // Top up the AlarmManager queue every time the app foregrounds. Recurring reminders'
          // next-next occurrences only get queued by reconcile, so without this, a daily
          // reminder fires once and then nothing until the next sync or reminder edit.
          useRemindersStore
            .getState()
            .load()
            .then(() => reconcileNotifications(useRemindersStore.getState().reminders))
            .catch(console.error)
        }).then((handle) => {
          cleanup = () => handle.remove()
        })
      })
    }).catch(() => {})
    return () => cleanup?.()
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
