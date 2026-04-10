# iOS Integration Guide

> **Prerequisite:** iOS development requires macOS with Xcode installed.
> If developing on WSL2/Linux, these steps must be run on a Mac.

The app uses [Capacitor 8](https://capacitorjs.com/) to wrap the React web build into a native iOS app.
The platform abstraction layer (`src/renderer/src/platform/`) already detects `Capacitor.isNativePlatform()`
and routes to `CapacitorAdapter` — but that adapter is currently a stub. The steps below complete the integration.

---

## Step 1 — Install Capacitor iOS packages

> **Status:** `@capacitor/core` and `@capacitor/cli` are already installed. Run the following to add the remaining packages:

```bash
npm install @capacitor/ios @capacitor/app @capacitor/status-bar @capacitor/keyboard @capacitor/haptics @capacitor/local-notifications
npm install @capacitor-community/sqlite
```

## Step 2 — Add the iOS platform

```bash
npx cap add ios
```

This generates the `ios/` Xcode project folder in the repo root.

## Step 3 — Implement CapacitorAdapter

**File:** `src/renderer/src/platform/capacitor.ts`

Replace the stub with a full implementation using `@capacitor-community/sqlite`.
The pattern mirrors `WebAdapter` (`src/renderer/src/platform/web.ts`) but uses SQLite instead of IndexedDB.
Schema and migrations mirror `src/main/storage/db.ts`.

Key notes:
- Add an `init()` method that opens the SQLite connection (same pattern as `WebAdapter.init()`)
- Reproduce the same 8-table schema: `reminders`, `notes`, `note_folders`, `todo_lists`, `todo_list_items`, `todo_folders`, `sync_meta` — with soft deletes (`deleted_at`) and `last_synced_at`
- Serialize `recurrence` and `completedDates` as JSON strings (same as the Electron adapter)
- Call `await capacitorAdapter.init()` from `initStorage()` in `src/renderer/src/platform/index.ts`, right after constructing the adapter (same place `WebAdapter.init()` is called)

## Step 4 — Configure auth deep link

Supabase magic link auth uses the `reminders://` custom URL scheme.

Add to `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>reminders</string>
    </array>
  </dict>
</array>
```

Then create `src/renderer/src/lib/mobileAuth.ts` to wire up `@capacitor/app`'s `appUrlOpen` event
and pass the callback URL to Supabase (mirrors the deep-link handler in `src/main/auth.ts`).

## Step 5 — Local notifications

Create `src/renderer/src/lib/mobileNotifications.ts` using `@capacitor/local-notifications`
to schedule reminder alerts when a reminder with a future `date` + `startTime` is saved.
Mirrors the logic in `src/main/notifications.ts` (the Electron version).

## Step 6 — Build and sync

```bash
npm run cap:sync   # builds dist/renderer, then copies assets into ios/
```

## Step 7 — Open Xcode and run

```bash
npx cap open ios
```

Select a simulator or physical device and hit **Run**. Watch the Xcode console for any JS bridge errors.

---

## Critical files

| File | Purpose |
|------|---------|
| `src/renderer/src/platform/capacitor.ts` | Adapter stub to implement |
| `src/renderer/src/platform/index.ts` | Platform detection — add `init()` call for Capacitor |
| `src/renderer/src/platform/web.ts` | Reference implementation (IndexedDB) |
| `src/main/storage/db.ts` | SQLite schema / migrations to mirror |
| `capacitor.config.ts` | App ID (`com.reminders.app`) and web dir |
| `ios/App/App/Info.plist` | URL scheme for auth deep links (created in Step 2) |

---

## Verification checklist

- [ ] `npm run build:web` completes without errors
- [ ] `npx cap sync` copies assets without errors
- [ ] App launches in iOS Simulator without JS errors in Xcode console
- [ ] Creating a reminder persists across app restarts
- [ ] Supabase magic link auth completes and redirects back into the app
- [ ] Reminder notification fires at the scheduled time
