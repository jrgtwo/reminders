# iOS App: Xcode Setup → Build → TestFlight

A complete guide for getting the iOS app running from scratch and distributing a test build via TestFlight. Written for someone new to iOS development.

---

## Prerequisites (one-time setup)

### 1. Apple Developer Account — $99/year

- Enroll at https://developer.apple.com/programs/
- Required for signing the app and publishing to TestFlight
- Usually approved same day, up to 48 hours
- Wait for the "Your membership is active" email before proceeding

### 2. Install Xcode

Search "Xcode" in the Mac App Store — it's free, ~15GB. Or:

```bash
open "macappstores://apps.apple.com/app/xcode/id497799835"
```

After install, open Xcode once (accepts license + installs components), then verify:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version   # should print "Xcode 16.x"
```

### 3. Xcode Tools

No additional dependency managers (like CocoaPods) are required, as this project uses Swift Package Manager.

Ensure your Xcode installation is ready by running:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version   # should print "Xcode 16.x"
```

---

## Phase 1 — Add iOS to the Project

### Step 1: Install `@capacitor/ios`

```bash
npm install @capacitor/ios
```

### Step 2: Scaffold the iOS native project

```bash
npx cap add ios
```

This creates the `ios/` directory with a full Xcode project inside.

### Step 3: Sync dependencies

```bash
npx cap sync ios
```

This wires the native Capacitor plugins into the Xcode project using Swift Package Manager.

---

## Phase 2 — Configure `capacitor.config.ts`

Update `capacitor.config.ts` to add iOS-specific plugin settings:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.remindertoday.app',
  appName: 'Reminders',
  webDir: 'dist/renderer',
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    LocalNotifications: {}
  }
}

export default config
```

---

## Phase 3 — App Icons

Install the assets tool:

```bash
npm install -D @capacitor/assets
```

Generate all required iOS icon sizes from `resources/icon.png` (must be 1024×1024):

```bash
npx @capacitor/assets generate --ios
```

This writes all sizes into `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

---

## Phase 4 — iOS Permissions (`Info.plist`)

Also add the Supabase auth deep link URL scheme (required for magic link login):

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

---

## Phase 5 — Add npm Scripts

Add the following new platform-specific scripts to `package.json`:

```json
"ios:sync": "npm run build:web && npx cap sync ios",
"ios:open": "npx cap open ios",
"ios:release": "node scripts/bump-ios-version.mjs && npm run build:web && npx cap sync ios"
```

Create `scripts/bump-ios-version.mjs` to increment the version in `ios/App/App.xcodeproj/project.pbxproj` (increments `CURRENT_PROJECT_VERSION` and `MARKETING_VERSION`) — mirrors `scripts/bump-android-version.mjs`.

---

## Phase 6 — First Build in Xcode

Sync the web build and open Xcode:

```bash
npm run ios:sync
npm run ios:open
```

Inside Xcode:

1. Click the project name (top of left sidebar) → **Signing & Capabilities** tab
2. Under **Team**, select your Apple Developer account
3. Confirm **Bundle Identifier** reads `com.remindertoday.app`
4. Top toolbar → pick any iPhone simulator (e.g. "iPhone 16")
5. Press **▶ (Cmd+R)** — app should launch in the iOS Simulator

---

## Phase 7 — TestFlight Distribution

TestFlight lets you share the app with testers before the App Store.

### 7a. Create the App Record

1. Go to https://appstoreconnect.apple.com
2. **My Apps → "+" → New App**
3. Platform = iOS, Name = "Reminder Today", Bundle ID = `com.remindertoday.app`, SKU = `reminders-001`

### 7b. Archive the Build

1. In Xcode, change the destination (top toolbar) to **"Any iOS Device (arm64)"** — not a simulator
2. **Product → Archive**
3. Wait ~2–5 min; the **Organizer** window opens automatically

### 7c. Upload to App Store Connect

1. In Organizer: select your archive → **Distribute App**
2. Choose **"TestFlight & App Store"** → Next
3. Choose **"Upload"** → Next through the defaults
4. Xcode uploads the build (~5–10 min)

### 7d. Add Testers

1. App Store Connect → **TestFlight** tab → wait ~15 min for the build to process
2. **Internal Testing** (up to 25 people with App Store Connect roles): add by Apple ID — available immediately
3. **External Testing** (anyone, up to 10,000): create a group → add email addresses → submit for Beta App Review (1–2 days first time, usually faster after)
4. Testers get an email invite → install the **TestFlight** app → tap the link

---

## Ongoing Workflow

After the initial setup, releasing a new build is:

```bash
npm run ios:release   # bumps version, builds web, syncs to Xcode project
# Then in Xcode: Product → Archive → Distribute App → Upload
```

---

## Critical Files

| File                                              | Purpose                                                 |
| ------------------------------------------------- | ------------------------------------------------------- |
| `capacitor.config.ts`                             | iOS plugin config (keyboard, status bar, notifications) |
| `ios/App/App/Info.plist`                          | auth URL scheme                                         |
| `package.json`                                    | `ios:sync`, `ios:open`, `ios:release` scripts           |
| `scripts/bump-ios-version.mjs`                    | Version bump for `project.pbxproj`                      |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/` | Generated app icons                                     |
| `src/renderer/src/platform/capacitor.ts`          | Capacitor storage adapter (already implemented)         |
| `src/renderer/src/lib/mobileNotifications.ts`     | Local notifications (already implemented)               |

---

## Verification Checklist

- [ ] `npx cap open ios` opens Xcode without errors
- [ ] App runs in iOS Simulator — auth, reminders, notes, todos all work
- [ ] Notification permission prompt appears on first launch
- [ ] Magic link email opens the app and completes sign-in
- [ ] Archive + upload to App Store Connect succeeds
- [ ] Testers receive TestFlight invite and can install the build
