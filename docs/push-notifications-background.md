# Background Push Notifications (Browser Closed)

## Context

The current notification system (`useNotifications.ts`) polls every 10 seconds while the tab is open. It works for desktop Chrome and mobile Chrome — but only while the browser is open. When the browser is fully closed, nothing fires.

True background push requires the **Web Push API**: a server sends a push message to the browser's push service (Google FCM for Chrome), which wakes the device's service worker and shows the notification — even with the browser closed.

**E2EE constraint**: Reminder titles are stored as `enc:...` ciphertext in Supabase. The server cannot decrypt them — the encryption key lives only on the user's device. Push payloads will carry `{ id, date, time }` only; the service worker shows "You have a reminder at HH:MM". The full title appears when the user opens the app. This is the standard pattern for E2EE apps (WhatsApp, Signal).

---

## Architecture

```
[Supabase Edge Function — runs every minute via pg_cron]
    ↓ queries reminders for current HH:MM (per user timezone)
    ↓ fetches matching push_subscriptions rows
    ↓ sends web push payload: { id, date, time }
        ↓
[Browser Push Service — Google FCM / Mozilla autopush]
        ↓ wakes device even when browser is closed
            ↓
[Service Worker push event]
            ↓ shows: "You have a reminder at 09:00"
            ↓ on tap → opens / focuses app tab
```

---

## Implementation Steps

### Step 1 — Generate VAPID keys (one-time, run locally)

```bash
npx web-push generate-vapid-keys
```

- **Public key** → `VITE_VAPID_PUBLIC_KEY` in `.env` and Vercel env vars (safe to expose)
- **Private key** → Supabase Edge Function secret `VAPID_PRIVATE_KEY` (never in frontend)
- **Subject** → `VAPID_SUBJECT=mailto:you@yourdomain.com` (identifies the push sender)

---

### Step 2 — Supabase: create `push_subscriptions` table

```sql
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  timezone    TEXT NOT NULL DEFAULT 'UTC',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

`timezone` stores the user's IANA timezone (e.g. `America/New_York`) so the Edge Function can convert reminder times from UTC to local time correctly.

---

### Step 3 — Update `src/renderer/public/sw.js`

Add a `push` event listener that receives `{ id, date, time }` and shows a notification:

```js
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const time = data.time ?? ''
  e.waitUntil(
    self.registration.showNotification('Reminder', {
      body: time ? `You have a reminder at ${time}` : 'You have a reminder',
      icon: '/icon-192.png',
      data: { url: data.date ? `/?date=${data.date}` : '/' },
    })
  )
})
```

Update `notificationclick` to navigate to the reminder's date:

```js
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
```

---

### Step 4 — Update `src/renderer/src/hooks/useNotifications.ts`

After SW registration succeeds and permission is granted, subscribe to push and save to Supabase. Add a `subscribeToPush` helper:

```ts
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function subscribeToPush(reg: ServiceWorkerRegistration, userId: string) {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) return

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const json = sub.toJSON()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth_key: json.keys?.auth,
    timezone,
  }, { onConflict: 'user_id,endpoint' })
}
```

Call `subscribeToPush(swReg.current, userId)` after the SW registers and permission is granted. The user ID comes from the auth store.

The existing in-tab 10s polling loop stays unchanged — it provides accurate minute-level timing when the tab is open and acts as a redundancy layer.

---

### Step 5 — Create Supabase Edge Function

**`supabase/functions/send-reminders/index.ts`**

Logic per invocation:
1. For each distinct `(user_id, timezone)` pair in `push_subscriptions`
2. Convert current UTC time to that timezone → get local `HH:MM` and `YYYY-MM-DD`
3. Query `reminders` for that user where `time = HH:MM`
4. For non-recurring: skip if `date ≠ today`
5. For recurring: check if today is a valid occurrence using the `recurrence` JSON (mirror logic from `src/renderer/src/utils/recurrence.ts` using `npm:rrule`)
6. Skip if today's date appears in `completed_dates`
7. Fetch all `push_subscriptions` for that user
8. Send push via `npm:web-push` with payload `{ id, date, time }`
9. On `410 Gone` response from push service → delete that subscription row (stale endpoint)

```ts
import webpush from 'npm:web-push'
import { createClient } from 'npm:@supabase/supabase-js'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

// ... query + timezone conversion + send loop
await webpush.sendNotification(
  { endpoint, keys: { p256dh, auth: auth_key } },
  JSON.stringify({ id: reminder.id, date: localDate, time: reminder.time })
)
```

---

### Step 6 — Schedule the Edge Function (every minute)

**Option A — Supabase pg_cron** (recommended):

In Supabase SQL editor (requires `pg_cron` and `pg_net` extensions enabled):

```sql
SELECT cron.schedule(
  'send-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>')
  );
  $$
);
```

**Option B — Supabase Edge Function scheduler** (dashboard UI):  
Dashboard → Edge Functions → `send-reminders` → Schedule → `* * * * *`

---

### Step 7 — Environment variables

Add to `.env.example`:
```
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

Add to **Vercel** project env vars: `VITE_VAPID_PUBLIC_KEY`

Add to **Supabase Edge Function secrets**:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

---

## Files to create / modify

| File | Action | What changes |
|------|--------|--------------|
| `src/renderer/public/sw.js` | Modify | Add `push` event handler; update `notificationclick` to use payload URL |
| `src/renderer/src/hooks/useNotifications.ts` | Modify | Add `subscribeToPush()` called after SW + permission ready |
| `supabase/functions/send-reminders/index.ts` | Create | Edge Function: query reminders + send web push per user |
| `supabase/functions/send-reminders/deno.json` | Create | Deno config for the function |
| `.env.example` | Modify | Add `VITE_VAPID_PUBLIC_KEY` |

SQL: create `push_subscriptions` table (run manually in Supabase SQL editor).  
Supabase secrets: add `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`.

---

## Recurring reminder challenge

The Edge Function needs to determine whether a recurring reminder fires today. The `recurrence` field is a JSON `RecurrenceRule` object (not an rrule string). Two options:

- **Preferred**: Use `npm:rrule` in Deno and mirror the `getOccurrencesInRange` logic from `src/renderer/src/utils/recurrence.ts`. Avoids logic divergence between client and server.
- **Fallback**: Inline a simple date expansion for ±1 day range if rrule causes issues in the Deno/Edge environment.

---

## Limitations

- **Title not included** — Push body shows time only due to E2EE. Real title visible on app open.
- **iOS Safari** — Web Push requires the app to be added to the home screen as a PWA (iOS 16.4+). A `manifest.json` would be needed to support this. Regular browser tabs on iOS don't receive push.
- **Stale subscriptions** — Endpoint becomes invalid if the user clears browser data. Handle `410 Gone` from the push service by deleting the row.
- **Multiple devices** — One subscription per browser/device. Edge Function sends to all; in-tab deduplication via the `fired` Set prevents double notifications when the tab is open.
- **In-tab polling stays** — The existing 10s poll is kept as a redundancy layer for accurate timing when the tab is open.

---

## Verification

1. Generate VAPID keys; set env vars in Vercel and Supabase secrets
2. Run `push_subscriptions` SQL in Supabase
3. Open app on mobile Chrome → check `push_subscriptions` table for a new row
4. Create a reminder 2 minutes from now with a time set
5. Close the browser entirely on mobile
6. Trigger the Edge Function manually (`curl` or Supabase dashboard)
7. Confirm notification appears on the locked device screen
8. Tap notification → confirm app opens to the correct date
