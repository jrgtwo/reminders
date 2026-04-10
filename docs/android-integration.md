# Android Integration Guide

> **Prerequisite:** Android development requires [Android Studio](https://developer.android.com/studio) installed.
> Android Studio runs on macOS, Windows, and Linux (including WSL2 with a GUI, or natively on the Windows side).

The app uses [Capacitor 8](https://capacitorjs.com/) to wrap the React web build into a native Android app.
The platform abstraction layer (`src/renderer/src/platform/`) detects `Capacitor.isNativePlatform()`
and routes to `CapacitorAdapter`.

---

## ✅ Step 1 — Install Capacitor Android packages

```bash
npm install @capacitor/android @capacitor/app @capacitor/status-bar @capacitor/keyboard @capacitor/haptics @capacitor/local-notifications
npm install @capacitor-community/sqlite
```

**Done.** All packages installed at Capacitor 8.

## ✅ Step 2 — Add the Android platform

```bash
npx cap add android
```

**Done.** The `android/` Gradle project exists in the repo root.

## ✅ Step 3 — Implement CapacitorAdapter

**Done.** `src/renderer/src/platform/capacitor.ts` is fully implemented using `@capacitor-community/sqlite`.
Full schema (all 8 tables with soft deletes and `last_synced_at`) is applied on first open via `CREATE IF NOT EXISTS`.
`src/renderer/src/platform/index.ts` calls `cap.init()` and routes `isNativePlatform()` correctly.

## ✅ Step 4 — Configure auth deep link

**Done.**

- `android/app/src/main/AndroidManifest.xml`: `reminders://callback` intent filter added inside `<activity>`
- `src/renderer/src/lib/mobileAuth.ts`: created — listens for `appUrlOpen`, exchanges PKCE code or sets session tokens
- `src/renderer/src/store/auth.store.ts`: calls `setupMobileAuth()` on native at init; `sendMagicLink` uses `reminders://callback` redirect on native (same as Electron)

## ✅ Step 5 — Local notifications

**Done.**

- `src/renderer/src/lib/mobileNotifications.ts`: created — `requestNotificationPermission`, `scheduleReminderNotification`, `cancelReminderNotification`
- `src/renderer/src/App.tsx`: requests permission at startup on native platforms
- `src/renderer/src/store/reminders.store.ts`: schedules notification on `save`, cancels on `remove`

Notification permission confirmed granted in emulator (`{"display":"granted"}`).

## ✅ Step 6 — Declare Android permissions

**Done.** `android/app/src/main/AndroidManifest.xml` has all required permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

## ✅ Step 7 — Build and sync

```bash
npm run build:web   # builds dist/renderer
npm run cap:sync    # copies assets into android/
```

**Done.** Both complete without errors.

## ✅ Step 8 — Open Android Studio and run

```bash
npx cap open android
```

**Done.** App launches in Android Emulator. SQLite reads/writes confirmed working in Logcat — reminders, notes, todo lists all persist correctly.

> **Note:** An `IllegalStateException` appears in Android Studio's Logcat when opening certain IDE settings dialogs. This is a known Android Studio bug unrelated to the app — ignore it.

> **Note:** Vercel Analytics (`/_vercel/insights/script.js`) is skipped on native builds — the `<Analytics />` component is conditionally excluded when `isElectronOrCapacitor` is true.

---

## Verification checklist

- [x] `npm run build:web` completes without errors
- [x] `npx cap sync` copies assets without errors
- [x] App launches in Android Emulator without JS errors in Logcat
- [x] Creating data (reminders, notes, lists) persists across app navigations and restarts
- [x] Notification permission granted at startup
- [ ] Supabase magic link auth completes and `reminders://callback` deep link returns user to app logged in
- [ ] Reminder notification fires at the scheduled time
- [ ] Signed `.aab` installs cleanly via internal testing track

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
| `src/renderer/src/platform/capacitor.ts` | Full SQLite adapter (shared with iOS) |
| `src/renderer/src/platform/index.ts` | Platform detection — routes to CapacitorAdapter on native |
| `src/renderer/src/lib/mobileAuth.ts` | Deep link auth handler (shared with iOS) |
| `src/renderer/src/lib/mobileNotifications.ts` | Local notification scheduling (shared with iOS) |
| `src/renderer/src/store/auth.store.ts` | Wires `setupMobileAuth()` and `reminders://callback` redirect |
| `src/renderer/src/store/reminders.store.ts` | Schedules/cancels notifications on save/delete |
| `capacitor.config.ts` | App ID (`com.reminders.app`) and web dir |
| `android/app/src/main/AndroidManifest.xml` | Permissions + intent filter for deep links |
| `android/app/build.gradle` | SDK versions, version code, signing config |
