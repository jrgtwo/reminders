import { LocalNotifications } from '@capacitor/local-notifications'
import type { Reminder } from '../types/models'

/**
 * Request notification permission on Android 13+ / iOS.
 * Call once at app startup before scheduling any notifications.
 */
export async function requestNotificationPermission(): Promise<void> {
  const { display } = await LocalNotifications.requestPermissions()
  if (display !== 'granted') {
    console.warn('Notification permission not granted')
  }
}

/**
 * Schedule a local notification for a reminder that has a future date + startTime.
 * Safe to call on every save — cancels any existing notification for this reminder
 * before re-scheduling, so updates are handled correctly.
 */
export async function scheduleReminderNotification(r: Reminder): Promise<void> {
  if (!r.startTime) return

  const [year, month, day] = r.date.split('-').map(Number)
  const [hour, minute] = r.startTime.split(':').map(Number)
  const fireAt = new Date(year, month - 1, day, hour, minute, 0)

  if (fireAt <= new Date()) return

  // Use a stable numeric id derived from the reminder's UUID
  const notifId = uuidToInt(r.id)

  await LocalNotifications.cancel({ notifications: [{ id: notifId }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notifId,
        title: r.title,
        body: r.description ?? `Reminder at ${r.startTime}`,
        schedule: { at: fireAt, allowWhileIdle: true },
      },
    ],
  })
}

/**
 * Cancel any scheduled notification for a reminder (call on delete).
 */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: uuidToInt(reminderId) }] })
}

/** Fold a UUID string into a positive 32-bit int for use as a notification id. */
function uuidToInt(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 8)
  return Math.abs(parseInt(hex, 16)) || 1
}
