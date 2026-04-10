# Android Integration Guide

> **Prerequisite:** Android development requires [Android Studio](https://developer.android.com/studio) installed.
> Android Studio runs on macOS, Windows, and Linux (including WSL2 with a GUI, or natively on the Windows side).

The app uses [Capacitor 8](https://capacitorjs.com/) to wrap the React web build into a native Android app.
The platform abstraction layer (`src/renderer/src/platform/`) already detects `Capacitor.isNativePlatform()`
and routes to `CapacitorAdapter` — but that adapter is currently a stub. Steps 3–5 below complete the integration
and are **shared with iOS** — implement them once and both platforms benefit.

---

## Step 1 — Install Capacitor Android packages

```bash
npm install @capacitor/android @capacitor/app @capacitor/status-bar @capacitor/keyboard @capacitor/haptics @capacitor/local-notifications
npm install @capacitor-community/sqlite
```

> If you've already installed these for iOS (`@capacitor/app`, `@capacitor/local-notifications`, `@capacitor-community/sqlite`), skip the duplicates.

## Step 2 — Add the Android platform

```bash
npx cap add android
```

This generates the `android/` Gradle project folder in the repo root (an Android Studio project).

## Step 3 — Implement CapacitorAdapter

> **Shared with iOS** — if this is already done, skip to Step 4.

**File:** `src/renderer/src/platform/capacitor.ts`

Replace the stub with a full implementation using `@capacitor-community/sqlite`.
The pattern mirrors `WebAdapter` (`src/renderer/src/platform/web.ts`) but uses SQLite instead of IndexedDB.
Schema and migrations mirror `src/main/storage/db.ts`.

Key notes:
- Add an `init()` method that opens the SQLite connection (same pattern as `WebAdapter.init()`)
- Reproduce the same 8-table schema: `reminders`, `notes`, `note_folders`, `todos`, `todo_folders`, `todo_lists`, `todo_list_items`, `sync_meta` — with soft deletes (`deleted_at`) and `last_synced_at`
- Serialize `recurrence` and `completedDates` as JSON strings (same as the Electron adapter)
- Call `await capacitorAdapter.init()` from `initStorage()` in `src/renderer/src/platform/index.ts`, right after constructing the adapter (same place `WebAdapter.init()` is called)

## Step 4 — Configure auth deep link

Supabase magic link auth uses the `reminders://` custom URL scheme. On Android this is configured via an **intent filter** in the manifest rather than `Info.plist`.

Add to `android/app/src/main/AndroidManifest.xml` inside the `<activity>` tag:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="reminders" android:host="callback" />
</intent-filter>
```

Then create `src/renderer/src/lib/mobileAuth.ts` to wire up `@capacitor/app`'s `appUrlOpen` event
and pass the callback URL to Supabase (mirrors the deep-link handler in `src/main/auth.ts`).

> If `mobileAuth.ts` was already created for iOS, Android will use the same file — the `appUrlOpen` API is cross-platform.

## Step 5 — Local notifications

> **Shared with iOS** — if `src/renderer/src/lib/mobileNotifications.ts` is already created, skip to Step 6.

Create `src/renderer/src/lib/mobileNotifications.ts` using `@capacitor/local-notifications`
to schedule reminder alerts when a reminder with a future `date` + `startTime` is saved.
Mirrors the logic in `src/main/notifications.ts` (the Electron version).

**Android-specific:** The plugin automatically creates a notification channel on Android 8+ (API 26+).
You can customise channel name, sound, and importance level via the plugin's `createChannel` method if needed.

## Step 6 — Declare Android permissions

Add the following to `android/app/src/main/AndroidManifest.xml` before the `<application>` tag:

```xml
<!-- Required for Supabase sync -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Required for scheduling exact-time reminder notifications -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

<!-- Required on Android 13+ to show notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Optional: re-schedule notifications after device reboot -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

At runtime, request `POST_NOTIFICATIONS` permission on Android 13+ before scheduling the first notification.
`@capacitor/local-notifications` exposes `requestPermissions()` for this.

## Step 7 — Build and sync

```bash
npm run cap:sync   # builds dist/renderer, then copies assets into android/
```

## Step 8 — Open Android Studio and run

```bash
npx cap open android
```

Select an emulator or physical device and click **Run**. Watch Logcat for any JS bridge errors.

---

## Play Store deployment

### App signing

Android requires all APKs/AABs to be signed. Google Play uses **App Signing by Google Play** (recommended):

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** — Play Store requires AAB format
3. Create a new keystore (keep it safe — losing it means you can't update the app)
4. Upload the `.aab` to Play Console; Google re-signs it for distribution

### Build configuration

Update `android/app/build.gradle` before submitting:

```groovy
android {
    defaultConfig {
        applicationId "com.reminders.app"
        minSdk 26          // Android 8.0 — covers ~95% of active devices
        targetSdk 35       // Must be API 35+ for new Play Store submissions (2025+)
        versionCode 1      // Increment with every Play Store release
        versionName "1.0.0"
    }
}
```

### App icon

Play Store requires a **512×512 PNG** hi-res icon. Capacitor also needs launcher icons in multiple densities.
Use Android Studio's **Image Asset Studio** (right-click `res` → New → Image Asset) to generate all sizes from a single source image.

Place icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (standard)
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png` (circular variant)

### Privacy policy

Play Store requires a privacy policy URL for any app that handles personal data (the app syncs via Supabase).
Add the URL to the Play Console listing and optionally to `AndroidManifest.xml`:

```xml
<meta-data
    android:name="android.support.privacy_policy"
    android:value="https://your-domain.com/privacy" />
```

### Play Console checklist

- [ ] Create app in [Google Play Console](https://play.google.com/console)
- [ ] Complete store listing: description, screenshots (phone + 7" tablet), feature graphic (1024×500)
- [ ] Set content rating via the questionnaire
- [ ] Add privacy policy URL
- [ ] Upload signed `.aab` to **Internal testing** track first
- [ ] Test on a real device via internal testing before promoting to production
- [ ] Set target audience and complete data safety form (declare: no data collected on-device; encrypted sync to Supabase)

---

## Key differences from iOS

| | iOS | Android |
|--|-----|---------|
| Auth deep link config | `Info.plist` URL scheme | `AndroidManifest.xml` intent filter |
| Notification channels | Handled automatically | Required from API 26+; `@capacitor/local-notifications` handles it |
| Runtime permissions | System prompt at first use | Must call `requestPermissions()` before scheduling notifications on Android 13+ |
| IDE | Xcode (macOS only) | Android Studio (cross-platform) |
| Distribution format | `.ipa` via App Store Connect | `.aab` via Google Play Console |
| Signing | Certificates via Apple Developer Program | Keystore file + Play App Signing |

---

## Critical files

| File | Purpose |
|------|---------|
| `src/renderer/src/platform/capacitor.ts` | Adapter stub to implement (shared with iOS) |
| `src/renderer/src/platform/index.ts` | Platform detection — add `init()` call for Capacitor |
| `src/renderer/src/platform/web.ts` | Reference implementation (IndexedDB) |
| `src/main/storage/db.ts` | SQLite schema / migrations to mirror |
| `capacitor.config.ts` | App ID (`com.reminders.app`) and web dir |
| `android/app/src/main/AndroidManifest.xml` | Permissions + intent filter for deep links (created in Step 2) |
| `android/app/build.gradle` | SDK versions, version code, signing config |

---

## Verification checklist

- [ ] `npm run build:web` completes without errors
- [ ] `npx cap sync` copies assets without errors
- [ ] App launches in Android Emulator without JS errors in Logcat
- [ ] Creating a reminder persists across app restarts
- [ ] Supabase magic link auth completes and redirects back into the app
- [ ] Reminder notification fires at the scheduled time
- [ ] Signed `.aab` installs cleanly via internal testing track
