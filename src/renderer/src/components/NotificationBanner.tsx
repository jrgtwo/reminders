import { useState, useCallback, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

const DISMISSED_KEY = 'notification_banner_dismissed'

const isElectronOrCapacitor =
  typeof window !== 'undefined' &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor?.isNativePlatform?.())

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isElectronOrCapacitor) return
    if (!('Notification' in window)) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (Notification.permission === 'granted') return

    setVisible(true)
  }, [])

  const handleEnable = useCallback(async () => {
    const result = await Notification.requestPermission()
    if (result === 'granted' || result === 'denied') {
      setVisible(false)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div className="relative flex items-center gap-2 px-4 py-2 bg-[var(--accent-muted)] border-b border-[var(--accent-border)] text-[var(--accent)] text-xs shrink-0">
      <Bell size={20} />
      <span className="flex-1">
        Notifications are not enabled — enable them to get reminders on time.
      </span>
      <button
        onClick={handleEnable}
        className="px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
      >
        Enable
      </button>
      <button
        onClick={handleDismiss}
        className="p-0.5 hover:bg-[var(--accent-muted)] rounded"
      >
        <X size={20} />
      </button>
    </div>
  )
}
