# Mobile Background Sync + Cross-Device Reminder Notifications

## Context

The Capacitor mobile app already fires local notifications when closed — but only for reminders that were *scheduled on that device before it closed*. Reminders created on another device (or on the web) won't fire on a phone that hasn't been opened since, because the phone never synced and never called `LocalNotifications.schedule()`.

This plan adds **periodic background sync on iOS + Android only**. While the app is closed, the OS wakes the app on a schedule, the app pulls new reminders from Supabase, decrypts them, and schedules local notifications. The user-visible alert remains a local notification — the OS handles the timer. There is no server push; no FCM, APNs, or Web Push.

Web and Electron are explicitly out of scope. Web users refresh the page; desktop users keep the app open.

A second motivation surfaced during planning: `mobileNotifications.ts` today schedules only the start date of recurring reminders, not subsequent occurrences. That fix is bundled here because the runner needs the same "next occurrence" logic.

> **Note**: There is a separate [`push-notifications-background.md`](./push-notifications-background.md) doc covering true Web Push for browser-closed notifications. That is a different scope — this doc is mobile-native only.

---

## ⚠️ Future Release Follow-Up: iOS Silent Push

**iOS BGAppRefresh is opportunistic — Apple may not fire it for days on devices that don't open the app often. This is a hard ceiling on iOS cross-device latency. If tight parity becomes a real complaint, the follow-up is silent push (deferred from this scope).**

The follow-up work would add APNs silent push (`content-available: 1`) to wake the app immediately on reminder create/update. The push payload still carries no reminder content — it's just a "sync now" signal — so E2E encryption is preserved. Requires:

- Apple Developer push certificate / auth key
- `@capacitor/push-notifications` plugin
- Push entitlement in Xcode
- Supabase edge function on insert/update of `reminders` to dispatch the silent push to all the user's other registered devices (via a new `device_tokens` table)

Re-evaluate after this v1 ships and we have real-world data on how often iOS users actually miss cross-device reminders.

---

## Design

```
┌─ Phone wakes up (iOS BGAppRefreshTask / Android WorkManager) ──────────┐
│                                                                         │
│  runner.js:                                                             │
│   1. Read access_token + key from CapacitorKV                           │
│   2. If token expired → POST /auth/v1/token (refresh)                   │
│   3. GET /rest/v1/reminders?user_id=eq.X&updated_at=gt.<cursor>         │
│   4. For each row:                                                      │
│      - If deleted_at set → schedule same id with scheduleAt=2099-01-01  │
│        (replaces any pending notification; user never sees it)          │
│      - Else: decrypt title/description, compute nextOccurrenceAt,       │
│        schedule({ id, scheduleAt, title, body })                        │
│   5. Write last_pull_at + last_run_at to CapacitorKV                    │
│   6. Call completed()                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─ Renderer startup (any time user opens the app) ───────────────────────┐
│                                                                         │
│  - LocalNotifications.getPending()                                      │
│  - Filter for scheduleAt year >= 2099 (the runner's tombstones)         │
│  - LocalNotifications.cancel(those IDs)                                 │
│  - Reconcile: schedule the soonest 50 within 30 days from local DB      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why "schedule a 2099 tombstone" works for soft-deletes

The runner has no cancel API. But scheduling the same id replaces the pending notification on both platforms — so scheduling at year 2099 effectively cancels the pending fire, and the user never sees it. The renderer's `@capacitor/local-notifications.cancel()` then properly cleans these up at the next app open.

### iOS 64-pending-notifications cap → hybrid horizon

iOS limits pending local notifications to 64 per app. The existing `mobileNotifications.ts` does not respect this and silently drops anything past the cap (latent bug this work fixes).

The fix is **rolling reconciliation with a hybrid horizon**: schedule reminders falling in the next **30 days** OR the **soonest 50** by fire time, **whichever is fewer**.

- Count cap = **50** (leaves 14 slots for tombstones below the iOS hard limit of 64)
- Time window = **30 days** (sparse users get the intuitive "everything this month is scheduled" feel)
- `min(soonest_50, within_30_days)` — predictable cap + rolling-window feel

Reconciliation runs on:
- Every runner pass (every ~15 min in background)
- Every app open (renderer)
- Every reminder create / update / delete (renderer callsites)

A shared pure function `reconcileSchedule(allReminders, currentlyPending, now)` returns `{ toSchedule, toCancel }` and lives in `src/shared/reminderSchedule.ts`. Both renderer and runner call it.

### Cluster warning toast at creation

When the user creates a new reminder whose fire time falls inside a 1-hour window already containing 50 reminders, show a toast:

> *"You've reached the maximum reminders for this 1-hour window — this one may not alert as a notification."*

Threshold tied to the count cap (50). Reminder still saves; warning is informational. Lives in the new-reminder save handler.

**Critical design constraints** (verified against plugin source after install):

- Runner globals: `fetch`, `crypto.subtle`, `TextEncoder/Decoder`, `setTimeout`, `console`, `CapacitorKV`, `CapacitorNotifications`, `CapacitorDevice`, `CapacitorApp`, `CapacitorGeolocation`, `CapacitorWatch`. **No `window`, `localStorage`, or `IndexedDB`.**
- Event handler signature: `addEventListener('sync', (resolve, reject, args) => {...})`. **Must** call `resolve()` or `reject()` or the OS kills the process. Async ops are fine; just `await` then resolve.
- `@supabase/supabase-js` does **not** work in the runner. Use raw REST against `/rest/v1/reminders` with `Authorization: Bearer <token>` + `apikey: <anon>` headers.
- `CapacitorNotifications.schedule(arr)` takes an **array directly** (not wrapped). Each item: `{ id: number, title: string, body: string, scheduleAt: Date, sound?, actionTypeId?, ... }`. iOS replaces by identifier (`UNTimeIntervalNotificationTrigger` with `id.toString()` as identifier). Android uses `AlarmManager.setExactAndAllowWhileIdle` with `PendingIntent` keyed by `id` + `FLAG_CANCEL_CURRENT`. **Same-id reschedule = replace on both.** ✅
- **No cancel API in the runner.** For soft-deletes the runner schedules the same id with `scheduleAt: new Date(2099, 0, 1)` — replaces the pending one with a far-future schedule the user will never see. Renderer's `LocalNotifications.cancel(id)` cleans these up at the next app open.
- `CapacitorKV` storage backend: iOS `UserDefaults.standard` (no suite); Android `SharedPreferences` named after the runner `label`. **Incompatible with `@capacitor/preferences` storage.** The renderer cannot read/write `CapacitorKV` directly. Solution: the renderer calls `BackgroundRunner.dispatchEvent({ label, event: 'setCredentials', details: {...} })`, and the runner's handler writes to `CapacitorKV`. Single owner pattern. **Re-dispatch on every app foreground** (not just auth state change) so the first-launch race self-heals on the next open.
- Runner JS file: `src` in `capacitor.config.ts` is relative to the app bundle public dir. After `npx cap sync`, contents of `dist/renderer/` copy into iOS `App/App/public/` and Android `android/app/src/main/assets/public/`. We need a **separate Vite build target** that emits a single ES bundle to `dist/renderer/runner.js` (no React, no node imports).

---

## Schema Changes

**Supabase** — add `notify_before` column to `reminders`:

- New migration `supabase/migrations/<timestamp>_add_notify_before_to_reminders.sql`
- `ALTER TABLE reminders ADD COLUMN notify_before INTEGER;`
- Run `npm run db:schema` to regenerate `supabase/schema.types.ts`

`notify_before` is already in SQLite (`db.ts:128`) and on the `Reminder` type (`models.ts:19`); only Supabase + the sync mappers are missing it.

---

## New Files

1. **`src/shared/reminderSchedule.ts`** — pure functions shared between renderer and runner. Uses `rrule` only; no Temporal, no DOM, no React.
   - `nextOccurrenceAt(reminder, now): Date | null` — recurrence-aware next occurrence calc. Fixes the existing day-1-only recurrence bug.
   - `reconcileSchedule(allReminders, currentlyPending, now, horizon = 50): { toSchedule, toCancel }` — hybrid horizon reconciliation.

2. **`src/runner/runner.js`** — background runner entrypoint. Bundled to a single ES module via a separate Vite/esbuild build target emitting `dist/renderer/runner.js`. Implements the flow above. Includes inline AES-256-GCM decrypt using Web Crypto's `crypto.subtle.decrypt` against the `enc:iv.ciphertext` sentinel.

3. **`src/renderer/src/lib/runnerBridge.ts`** — renderer-side helpers:
   - `setCredentials({...})` — dispatches `setCredentials` event to runner with `{ access_token, refresh_token, expires_at, supabase_url, supabase_anon_key, user_id, enc_key }`.
   - **Re-dispatch on every app foreground** + on auth state change. Self-heals first-launch race.
   - `cleanupTombstones()` — `getPending()` → filter `scheduleAt year >= 2099` → `cancel()`.

4. **`supabase/migrations/<timestamp>_add_notify_before_to_reminders.sql`** — schema migration.

---

## Files to Modify

- **`package.json`** — add `@capacitor/background-runner`.

- **`capacitor.config.ts`** — add `BackgroundRunner` plugin block:
  ```ts
  BackgroundRunner: {
    label: 'com.remindertoday.app.sync',
    src: 'runner.js',
    event: 'sync',
    repeat: true,
    interval: 15,        // minutes — Android floor; iOS treats as hint only
    autoStart: true,
  }
  ```

- **`ios/App/App/Info.plist`** — add:
  - `UIBackgroundModes` array: `fetch`, `processing`
  - `BGTaskSchedulerPermittedIdentifiers` array: `com.remindertoday.app.sync`

- **`ios/App/App/AppDelegate.swift`** — verbatim from plugin README:
  ```swift
  import CapacitorBackgroundRunner   // top of file

  // inside didFinishLaunchingWithOptions, before `return true`:
  BackgroundRunnerPlugin.registerBackgroundTask()
  BackgroundRunnerPlugin.handleApplicationDidFinishLaunching(launchOptions: launchOptions)
  ```
  Background Modes capability must also be enabled in Xcode UI (`Background fetch` + `Background processing`) — manual step.

- **`android/app/build.gradle`** — add to the `repositories.flatDir.dirs` array:
  ```
  '../../node_modules/@capacitor/background-runner/android/src/main/libs'
  ```

- **`android/app/src/main/AndroidManifest.xml`** — no changes needed. Existing `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` cover it.

- **`src/renderer/src/lib/keyManager.ts`** — when on Capacitor native, after `cacheKeyLocally()` succeeds (lines ~68, 83), call `runnerBridge.setCredentials({ encKey, userId })` to hand off to the runner via `dispatchEvent`. Renderer continues to read from `localStorage` as before — only the runner needs `CapacitorKV`.

- **`src/renderer/src/lib/webSync.ts`** — add `notify_before: r.notifyBefore ?? null` to `reminderToRow()` (lines 21-34) and `notifyBefore: row.notify_before ?? undefined` to `rowToReminder()` (lines ~42-55).

- **`src/renderer/src/lib/mobileNotifications.ts`** — significant rework:
  - Replace per-reminder `scheduleReminderNotification` with `reconcileNotifications(allReminders)` that:
    1. Calls `LocalNotifications.getPending()`
    2. Drains tombstones (year-2099 sentinels) via `cancel()`
    3. Calls `reconcileSchedule()` from shared module
    4. Applies `cancel()` then `schedule()` to the OS queue
  - Use `nextOccurrenceAt()` for fire-time computation (fixes existing day-1-only recurrence bug).
  - Existing callers change to `reconcileNotifications(allReminders)` — call after every reminder create/update/delete with the full list.

- **Reminder creation form** (wherever the new-reminder save handler lives) — before saving, count reminders that fall in the same 1-hour window as the new fire time. If ≥ 50, show the cluster warning toast. Save the reminder regardless.

- **`src/renderer/src/App.tsx`** — call `reconcileNotifications(allReminders)` post-auth/storage init. Drains tombstones and re-buckets to the soonest 50.

- **`src/renderer/src/store/auth.store.ts`** — on `onAuthStateChange`, when on Capacitor native, persist `session.access_token`, `session.refresh_token`, `session.expires_at` to `CapacitorKV` via `runnerBridge`.

- **`supabase/schema.types.ts`** — regenerated by `npm run db:schema`.

---

## Existing Code to Reuse

- `src/renderer/src/lib/encryption.ts` — `decrypt()` logic; the runner inlines an equivalent (single ~30-line function) since it can't import the renderer module.
- `src/renderer/src/utils/recurrence.ts` — extract the rrule-based next-occurrence computation into `src/shared/reminderSchedule.ts`. Update existing callers to use the new path.
- `mobileNotifications.ts:97` — `uuidToInt(reminder.id)` for deterministic notification IDs. Reused in the runner.
- `mobileNotifications.ts:99` — existing `cancel-then-schedule` idempotency pattern. Mirror it in the runner.

---

## Order of Operations

1. **Ship the schema first.** Supabase migration + types + `webSync.ts` mappers. Lets all renderers populate `notify_before` for at least one release before the runner reads it.

2. **Extract `reminderSchedule.ts`** and refactor `mobileNotifications.ts` to use it. Independent improvement; fixes recurring reminders now firing only on day 1. Ship.

3. **Wire token + key handoff to `CapacitorKV`.** Add `runnerBridge.ts`, modify `auth.store.ts` and `keyManager.ts`. Validate by writing a tiny no-op runner that logs the values it reads.

4. **Implement `runner.js`.** Build incrementally:
   - Token refresh → log result
   - REST pull → log row count
   - Decrypt → log titles
   - Schedule via `CapacitorNotifications.schedule` → verify on device
   - Cancel-on-soft-delete

5. **Wire up native config.** `capacitor.config.ts` + `Info.plist` + `AppDelegate.swift`. `npx cap sync`. Test BGAppRefresh via Xcode "Simulate Background Fetch."

---

## Risks & Known Limitations

- **iOS BGAppRefresh is opportunistic** — see Future Release Follow-Up section above.
- **Supabase access token lifetime is ~1 hour.** Runner-side refresh-token logic is the most likely production failure mode. Surface `last_run_error` from `CapacitorKV` in a debug view so we can diagnose in the field.
- **Action buttons (Snooze/Complete) on runner-scheduled notifications are unverified.** Confirm `CapacitorNotifications.schedule` supports `actionTypeId` by reading the plugin source. If not, runner-scheduled notifications will be tap-only — document the limitation.
- **Battery optimization on Android stretches the 15-min interval.** Doze + App Standby Buckets are out of our control.
- **`CapacitorKV` vs `@capacitor/preferences` storage compatibility** — verify (by reading the plugin's iOS Swift source) whether they share the same `UserDefaults` suite on iOS. If not, the renderer needs a small native bridge to write into the same suite the runner reads. Check before implementation.

---

## Verification

**Unit:**
- `nextOccurrenceAt` test cases covering non-recurring, daily/weekly/monthly recurrence past the start date, end-date / count termination, around DST boundaries.
- Token-refresh path (mocked `fetch`) returning expired-then-valid.

**Manual on-device (each platform):**

1. Sign in on Phone A, create a reminder due in 30 minutes. Force-quit the app.
2. Sign in on Phone B with same account. Force-quit.
3. From web, create a reminder for Phone B's user, due in 25 min.
4. Wait. Trigger background fetch via Xcode (iOS) / `adb shell cmd jobscheduler run` (Android) to simulate. Phone B's lock screen should show the reminder at fire time.
5. Delete the reminder from web. Trigger another sync. Confirm Phone B cancels the local notification (no fire).
6. Test recurring: create a daily reminder. Confirm day-2 occurrence fires (this validates the recurrence fix).

**Telemetry to add:** runner writes `last_run_at`, `last_run_error`, `last_synced_count` to `CapacitorKV`; surface in Settings → debug.
