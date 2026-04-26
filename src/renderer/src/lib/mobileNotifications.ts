import { LocalNotifications } from '@capacitor/local-notifications'
import type { Reminder } from '../types/models'
import { getSnoozeDuration } from '../components/settings/NotificationsSection'
import {
  reconcileSchedule,
  uuidToInt,
  isTombstone,
  type SchedulableReminder,
  type PendingNotification,
} from '../../../shared/reminderSchedule'

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
 * Register notification action types for snooze/complete buttons.
 * Call once at app startup after requesting permission.
 */
export async function registerNotificationActions(): Promise<void> {
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'REMINDER_ACTIONS',
        actions: [
          { id: 'snooze', title: 'Snooze' },
          { id: 'complete', title: 'Complete' },
        ],
      },
    ],
  })
}

export async function listenForNotificationActions(
  onSnooze: (reminderId: string, date: string) => void,
  onComplete: (reminderId: string, date: string) => void,
): Promise<void> {
  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = event.notification.extra as { reminderId?: string; date?: string } | undefined
    if (!extra?.reminderId || !extra?.date) return

    if (event.actionId === 'snooze') {
      onSnooze(extra.reminderId, extra.date)
    } else if (event.actionId === 'complete') {
      onComplete(extra.reminderId, extra.date)
    }
  })
}

export async function snoozeNotification(r: Reminder): Promise<void> {
  const snoozeDuration = getSnoozeDuration()
  const fireAt = new Date(Date.now() + snoozeDuration * 60_000)

  // Snoozes use a separate id space so they don't collide with the original
  const notifId = uuidToInt(r.id) ^ 0x7fff

  await LocalNotifications.cancel({ notifications: [{ id: notifId }] })
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notifId,
        title: r.title,
        body: r.description ?? `Snoozed reminder`,
        schedule: { at: fireAt, allowWhileIdle: true },
        actionTypeId: 'REMINDER_ACTIONS',
        extra: { reminderId: r.id, date: r.date },
      },
    ],
  })
}

/**
 * Reconcile the OS notification queue against the current set of reminders.
 *
 * - Drains "tombstone" notifications the background runner left behind (year 2099 sentinels)
 *   to mark soft-deleted reminders we couldn't cancel directly from the runner context.
 * - Schedules the soonest 50 reminders within the next 30 days (hybrid horizon — respects
 *   the iOS 64-pending cap, leaves headroom for runner-set tombstones).
 * - Cancels anything currently pending that's outside the horizon.
 *
 * Safe to call after every reminder create/update/delete and on app startup.
 */
export async function reconcileNotifications(allReminders: Reminder[]): Promise<void> {
  const { notifications } = await LocalNotifications.getPending()

  // Drain tombstones first
  const tombstoneIds = notifications
    .filter((n) => {
      const at = n.schedule?.at ? new Date(n.schedule.at) : null
      return at ? isTombstone(at) : false
    })
    .map((n) => ({ id: n.id }))
  if (tombstoneIds.length > 0) {
    await LocalNotifications.cancel({ notifications: tombstoneIds })
  }

  const pending: PendingNotification[] = notifications
    .filter((n) => {
      const at = n.schedule?.at ? new Date(n.schedule.at) : null
      return at ? !isTombstone(at) : false
    })
    .map((n) => ({ id: n.id, scheduleAt: new Date(n.schedule!.at!) }))

  const { toSchedule, toCancel } = reconcileSchedule(
    allReminders as SchedulableReminder[],
    pending,
    new Date(),
  )

  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel.map((id) => ({ id })) })
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: toSchedule.map((s) => {
        const reminder = allReminders.find((r) => r.id === s.reminderId)!
        return {
          id: s.id,
          title: s.title,
          body: s.body,
          schedule: { at: s.fireAt, allowWhileIdle: true },
          actionTypeId: 'REMINDER_ACTIONS',
          extra: { reminderId: reminder.id, date: reminder.date },
        }
      }),
    })
  }
}

/**
 * Cancel any scheduled notification for a reminder (call on delete).
 *
 * Note: prefer calling `reconcileNotifications(allReminders)` after a delete instead — it
 * handles tombstone cleanup and re-bucketing in one pass. This direct cancel is kept for
 * call sites that don't have the full reminder list handy.
 */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: uuidToInt(reminderId) }] })
}
