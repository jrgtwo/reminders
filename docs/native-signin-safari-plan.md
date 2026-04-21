# Native Sign-in via SFSafariViewController with Multi-env Support

## Context
Turnstile fails in WKWebView (iOS native) due to browser fingerprinting. The fix is to open the web settings page in SFSafariViewController (real Safari) where Turnstile works correctly. We need to support pointing to different web app URLs per environment: local, dev, and prod.

---

## Manual Steps (must be done by developer)

### A. Cloudflare Turnstile Dashboard
Go to https://dash.cloudflare.com → Turnstile → your site key → Settings → Allowed Origins. Add:
- `http://localhost:5173` (local dev)
- `https://dev.remindertoday.com` (dev environment)
- `https://remindertoday.com` (prod — likely already there)

### B. Vercel — Set up dev.remindertoday.com
1. In Vercel dashboard, go to your project → Settings → Domains
2. Add `dev.remindertoday.com`
3. In your DNS provider, add a CNAME record: `dev` → `cname.vercel-dns.com`
4. In Vercel, configure this domain to point to your main branch preview or a dedicated dev branch

### C. Environment files
Create/update these local files (not committed):

**.env.local** (local dev):
```
VITE_WEB_APP_URL=http://localhost:5173
```

**Vercel environment variables for dev.remindertoday.com:**
```
VITE_WEB_APP_URL=https://dev.remindertoday.com
```

**Vercel environment variables for remindertoday.com (prod):**
```
VITE_WEB_APP_URL=https://remindertoday.com
```

---

## Code Changes

### 1. `.env.example`
Add:
```
VITE_WEB_APP_URL=https://remindertoday.com
```

### 2. `capacitor.config.ts`
Remove `iosScheme: 'https'` added during debugging. Revert server block to:
```ts
server: {
  hostname: 'remindertoday.com',
},
```

### 3. `src/renderer/src/components/settings/AccountSection.tsx`

**Change 1 — Browser.open URL:**
Replace `window.location.origin` with `import.meta.env.VITE_WEB_APP_URL` and pass email as a query param:
```ts
await Browser.open({
  url: `${import.meta.env.VITE_WEB_APP_URL}/settings?email=${encodeURIComponent(email.trim())}`,
})
```

**Change 2 — Pre-fill email from query param on mount:**
Add a `useEffect` that reads `?email=` from the URL on mount and pre-fills the email state. This way when SFSafariViewController opens the web settings page, the email is already filled in and the user only needs to complete Turnstile and click Send.

**Change 3 — Turnstile stays unchanged:**
The `!isCapacitor` guard on the Turnstile widget stays as-is. Turnstile renders on the web page inside SFSafariViewController — not in the native app. No change needed here.

---

## Sign-in Flow After This Change

**iOS native:**
1. User enters email in native app
2. Taps Send link → SFSafariViewController opens `{VITE_WEB_APP_URL}/settings?email=user@example.com`
3. Web page loads, email pre-filled, Turnstile renders (real Safari — passes every time)
4. User completes Turnstile, taps Send
5. Magic link sent to email
6. User taps magic link → deep links back into the native app

**Web:**
Unchanged. Turnstile renders inline, user submits directly.

---

## Verification
1. Run `npm run dev:web` locally with `VITE_WEB_APP_URL=http://localhost:5173` in `.env.local`
2. Build and sync Capacitor: `npm run build:web && npm run cap:sync`
3. Open iOS simulator — enter email, tap Send link
4. SFSafariViewController should open `http://localhost:5173/settings?email=...`
5. Confirm email is pre-filled, Turnstile loads and passes, magic link arrives
6. Repeat against `https://dev.remindertoday.com` once Vercel domain is set up
