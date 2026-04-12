# Monetization Strategy — Reminder Today

Reminder Today is a local-first, privacy-focused productivity app (reminders, calendar, notes, todos) available on web, desktop (Electron), and mobile (Capacitor). It has end-to-end encryption and cross-device sync via Supabase. This document outlines practical monetization strategies that fit the app's privacy-first, calm-productivity brand.

---

## 1. Freemium Subscription _(Primary Recommendation)_

**Model:** Free tier with local-only use; paid tier unlocks cloud sync and premium features.

**Free tier:**
- Local-only (no sync)
- Unlimited reminders, notes, todos on one device

**Pro tier (~$4–6/month or ~$36–48/year):**
- Unlimited cloud sync across all devices
- Priority support

**Why it fits:** Auth and Supabase sync infrastructure already exists. Gating sync is a natural upsell that doesn't degrade the local experience. Privacy-conscious users often pay for trustworthy, simple tools.

**Implementation sketch:**
- Add a `plan` column to the user profile in Supabase
- Gate sync operations on `plan === 'pro'`
- Integrate Stripe Checkout + webhooks for subscription lifecycle
- Surface upgrade prompts in settings or CommandCenter

---

## 2. One-Time Purchase for Desktop App

**Model:** The web app stays free; the desktop (Electron) app is a paid download (~$15–25 one-time).

**Why it fits:** Many productivity users prefer native apps and are accustomed to paying for them (Things 3, Bear, Craft). The Electron app already exists.

**Distribution channels:**
- Direct download via Gumroad, Lemon Squeezy, or Paddle
- Mac App Store / Microsoft Store (higher reach, 30% cut)

**Tradeoff:** One-time purchases don't generate recurring revenue. Best combined with a freemium web subscription.

---

## 3. Lifetime Deal (LTD)

**Model:** Sell lifetime Pro access at a discounted price (~$49–79) to early adopters via AppSumo or direct.

**Why it fits:** Generates upfront cash to fund development and builds a loyal early user base. Common launch strategy for indie productivity tools.

**Risk:** Support burden grows without recurring revenue. Cap the number of LTD seats to manage this.

---

## 4. Team / Shared Lists Plan

**Model:** A team tier (~$8–12/user/month) enabling shared todo lists or reminder calendars within a workspace.

**Features:**
- Shared lists and reminders visible to team members
- Basic activity feed
- Admin seat management

**Why it fits:** Todos already support named lists; extending to shared lists is a natural evolution. Teams pay more reliably than individuals.

**Complexity:** Requires multi-user data model changes in Supabase and access control logic — higher implementation cost than individual tiers.

---

## 5. Voluntary Donation / Tip Jar

**Model:** Completely optional one-time or recurring donation (Buy Me a Coffee, GitHub Sponsors, Polar.sh).

**Why it fits:** Low effort to implement; works well for privacy-first tools with a loyal audience. Doesn't require feature gating.

**Realistic ceiling:** Low — best treated as a supplement rather than a primary revenue source.

---

## 6. White-Label / Self-Hosting License

**Model:** Charge teams or developers who want to self-host the app on their own infrastructure (~$200–500/year per org for a commercial license).

**Why it fits:** The current MIT license allows free self-hosting. Switching to a source-available license (BSL, SSPL) for commercial use while keeping personal use free is a proven indie-SaaS model used by Plausible and Fathom.

**Tradeoff:** Requires a license change and may reduce community contributions.

---

## 7. API Access / Integrations _(Long-term)_

**Model:** Expose a REST API and/or webhooks so users can integrate reminders with other tools. Gate heavy usage behind a paid API tier.

### Why it fits

Power users want reminders wired into other systems — Slack digests, home automation, custom scripts, data pipelines. There is currently no public API: the app talks directly to Supabase via its JavaScript client from the Electron main process. An API layer would unlock an entirely new class of integration use cases.

### What the API would expose

The internal data model maps cleanly to a simple REST API:

| Resource | Key fields |
|---|---|
| `GET/POST/PUT/DELETE /reminders` | `id`, `title`, `description`, `date`, `startTime`, `endTime`, `recurrence` (rrule), `completedDates[]` |
| `GET/POST/PUT/DELETE /notes` | `id`, `title`, `content` (Markdown), `date`, `folderId` |
| `GET/POST/PUT/DELETE /todos` | `id`, `title`, `completed`, `dueDate`, `listId` |
| `GET /reminders?date=YYYY-MM-DD` | Query by date (already exists in the local SQLite layer as `getRemindersByDate`) |

### Webhooks

In addition to polling REST endpoints, outbound webhooks could notify external systems when a reminder fires, a todo is completed, or a note is created. This is the integration model used by tools like Linear and Notion.

**Example use cases:**
- Send a Slack message when a reminder is due
- Trigger a Zapier/Make/n8n workflow on reminder creation
- Sync completed todos to a time-tracking tool
- Push upcoming reminders to a home automation dashboard (Home Assistant, etc.)

### Architecture path

The cleanest approach is **Supabase Edge Functions** (Deno), which sit in front of the existing Postgres tables and can issue API tokens per user. This avoids standing up a separate server.

1. Create a `api_tokens` table in Supabase (user_id, token_hash, scopes, rate_limit_tier)
2. Edge Functions validate the bearer token, enforce rate limits, and proxy CRUD to the existing tables
3. Webhook delivery via a `webhook_subscriptions` table + a scheduled Supabase Edge Function that fans out events

### Pricing tier model

| Tier | Price | Rate limit |
|---|---|---|
| Free | $0 | 100 requests/day |
| Hobbyist | ~$3/month | 5,000 requests/day |
| Power | ~$10/month | 50,000 requests/day + webhooks |

API access could be bundled with the Pro subscription or sold separately. If bundled, it strengthens the Pro value proposition without adding a new checkout flow.

### Implementation complexity

Medium-high. The data model is already well-defined in `src/renderer/src/types/models.ts`. The main investment is:
- API token management UI
- Supabase Edge Functions for each resource
- Webhook delivery infrastructure
- Stable API versioning and documentation

---

## 8. Calendar Interoperability (iCal Import / Export)

This is less a monetization strategy and more a **growth and retention feature** — but it directly enables the API strategy and could be a Pro-tier differentiator.

### The standard: iCalendar (.ics)

iCalendar (RFC 5545) is the universal calendar exchange format supported by Google Calendar, Apple Calendar, Outlook, Fastmail, Proton Calendar, and most calendar apps. It uses `.ics` files containing `VCALENDAR` > `VEVENT` records.

### Export: Reminders → iCal

The reminder data model maps almost 1:1 to `VEVENT`:

| Reminder field | iCal field |
|---|---|
| `title` | `SUMMARY` |
| `description` | `DESCRIPTION` |
| `date` + `startTime` | `DTSTART` |
| `endDate` + `endTime` | `DTEND` |
| `recurrence` (frequency, interval, byDay, count, endDate) | `RRULE` |
| `id` | `UID` |
| `completedDates` | `STATUS:COMPLETED` per occurrence |

The app already uses the `rrule` library for recurrence, and rrule strings are the native format inside iCal's `RRULE:` field — so the translation is almost free.

**Recommended library:** `ical-generator` (npm) — generates valid `.ics` files from JS objects with full RRULE support.

**Export modes:**
- **One-shot file download** — already fits the existing `exportToFile()` pattern in `src/renderer/src/utils/exportImport.ts`
- **Live calendar subscription URL** (CalDAV/ICS feed) — a static or dynamic `.ics` URL that calendar apps can subscribe to and poll for updates; this requires the API layer above

### Import: iCal → Reminders

Parsing `.ics` files to create reminders is straightforward with `ical.js` or `node-ical`. The main mapping challenge is handling:
- All-day events vs. timed events (`DTSTART;VALUE=DATE` vs. `DTSTART:YYYYMMDDTHHMMSSZ`)
- Recurring events (RRULE → recurrence object)
- Events with no description or no end time

**Import flow:**
1. User selects a `.ics` file (same dialog pattern as current JSON import)
2. Parse VEVENTs into reminder objects
3. Preview screen showing what will be imported
4. Confirm → write to local store

### CalDAV (two-way live sync)

Full two-way sync with Google Calendar or Apple Calendar uses the **CalDAV protocol** (RFC 4791), which is significantly more complex — it requires implementing a CalDAV server or using a CalDAV client to connect to the user's existing calendar provider. This is a large engineering investment but would make Reminder Today a true calendar hub rather than a silo.

**Simpler alternative:** Subscribe-only ICS feed (read-only push from Reminder Today into other calendar apps). This is 20% of the effort for 80% of the value — users can see their reminders in Google Calendar or Apple Calendar without two-way sync complexity.

### Notes and Todos

Notes (Markdown) don't map to calendar events. Todos with due dates could be exported as `VTODO` components within the iCal standard, which is supported by some apps (Apple Reminders, Fastmail) but ignored by others (Google Calendar).

### Monetization angle

- **Free:** One-shot `.ics` file export/import
- **Pro:** Live ICS subscription URL (requires API layer) + CalDAV import from other providers

This gives Pro users a "reminders live in my calendar app too" experience that's hard to replicate with a local-only free account.

### Implementation effort

**iCal file export/import:** Low — 1–2 days. Add alongside the existing JSON export in `exportImport.ts` using `ical-generator` for output and `ical.js` for parsing.

**Live ICS feed URL:** Medium — needs the API/token layer from strategy 7.

**CalDAV two-way sync:** High — separate project.

---

## Recommended Roadmap

**Phase 1 — Individual monetization (lowest effort, highest fit):**
- Freemium subscription on the web (Stripe + Supabase plan column)
- Optional: one-time purchase for the desktop app
- Local-only experience stays completely free — keeps the privacy-first brand intact

**Phase 2 — Growth:**
- Lifetime deal to build an early adopter base and generate upfront revenue

**Phase 3 — Teams:**
- Team plan with shared lists once the individual subscriber base is established

---

## Phase 1 Implementation Plan

### Pricing

**$5/month or $45/year.**

Cost basis:
- Supabase free tier covers ~50K MAU with light usage. Pro tier is $25/month flat.
- Vercel free tier handles static hosting comfortably at early-stage traffic.
- Stripe fees: ~$0.44/transaction on $5/month, ~$1.60 on $45/year.
- Break-even on Supabase Pro: 6 paying users at $5/month.

$5/month is low enough to be an easy yes for productivity users and still covers infrastructure costs at a small user base. The annual plan ($45 = 9 months) rewards commitment and improves cash flow.

---

### Value Ladder

| State | What they get |
|---|---|
| No account | Local-only, **unencrypted** data on one device |
| Free account | Local-only, **encrypted** data on one device |
| Pro account | Encrypted data, **synced across all devices** |

The encryption benefit of a free account is a real, concrete upsell over no account. This makes account creation valuable even before paying.

---

### Exploratory Phase — UX & Copy

Before writing code, the following touchpoints need design decisions on placement, copy, and dismissibility.

#### Touchpoint 1 — No-account upsell (Settings → Account section)

**Location:** Directly below the magic link signin form in `SettingsPage.tsx`, visible to logged-out users.

**Goal:** Explain why signing up (for free) is worth it — encryption.

**Proposed copy:**
> **Sign in to encrypt your data**
> Your reminders, notes, and todos are stored unencrypted on this device. Sign in for free to protect them with end-to-end encryption. No payment required.

**Design questions to resolve:**
- Inline text below the form, or a distinct card/banner above it?
- Icon: `ShieldCheck` (already imported in SettingsPage) fits well.
- Should it be dismissible? Recommendation: no — it's genuinely useful info, not spam.

#### Touchpoint 2 — Free-plan upsell (Settings → Sync section)

**Location:** Replace the sync controls in `SettingsPage.tsx` (lines 134–198) with an upgrade card when `plan === 'free'`.

**Goal:** Convert logged-in free users to Pro.

**Proposed copy:**
> **Sync across all your devices — $5/month**
> Upgrade to Pro to keep your encrypted data in sync across web, desktop, and mobile. Cancel anytime.
> [Upgrade to Pro →]

**Design questions to resolve:**
- Show price inline or on a separate pricing page?
- After clicking "Upgrade to Pro", open Stripe Checkout in a new browser tab.
- On return from Stripe (via `?upgraded=true` query param), show a success state and reload plan from Supabase.

#### Touchpoint 3 — Plan badge (Settings → Account section, logged-in state)

**Location:** Next to the user's email in the account card.

**Goal:** Make plan status visible at a glance; give Pro users a path to manage their subscription.

**Free:** Show a `Free plan` badge with an "Upgrade" link.
**Pro:** Show a `Pro` badge with a "Manage subscription" link (Stripe Customer Portal).

#### Touchpoint 4 — Sync interception (edge case)

If a free-plan user somehow triggers sync (keyboard shortcut, future feature), `sync.store.ts` returns early silently. No modal needed — the Settings upsell is sufficient.

---

### Database Changes

**New migration file:** `supabase/migrations/20260412000000_add_profiles.sql`

```sql
-- profiles table: one row per user, auto-created on signup
CREATE TABLE profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Only the service role (webhook) can update plan
CREATE POLICY "profiles_update_service" ON profiles
  FOR UPDATE USING (auth.role() = 'service_role');

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

**RLS on sync tables** — add to the same migration or a follow-up:

```sql
-- Gate all sync writes on plan = 'pro'
-- (reads are allowed for free users so they can pull their own data if they upgrade later)
CREATE POLICY "pro_sync_insert" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND plan = 'pro')
  );
-- Repeat for: notes, note_folders, todos, todo_lists, todo_list_items, todo_folders
```

---

### Auth Store Changes

**File:** `src/renderer/src/store/auth.store.ts`

Add `plan: 'free' | 'pro'` to `AuthState`. After `initEncryptionKey` resolves on login, fetch the user's profile from Supabase and set the plan. On sign-out, reset to `'free'`.

```ts
// In AuthState interface
plan: 'free' | 'pro'

// After initEncryptionKey resolves in getSession and onAuthStateChange handlers:
const { data: profile } = await supabase
  .from('profiles')
  .select('plan')
  .eq('user_id', session.user.id)
  .single()
set({ plan: profile?.plan ?? 'free' })

// In signOut:
set({ user: null, session: null, isLoggedIn: false, plan: 'free' })
```

---

### Sync Gating

**File:** `src/renderer/src/store/sync.store.ts`

Add a plan check at the top of `trigger()`:

```ts
trigger: async () => {
  if (useAuthStore.getState().plan !== 'pro') return
  // ... rest of existing logic
}
```

The server-side RLS policies above are the real enforcement layer. The client-side check just prevents unnecessary network attempts.

---

### Stripe Integration

#### Environment variables to add to `.env` and `.env.example`

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...           # server-side only (Edge Function)
STRIPE_WEBHOOK_SECRET=whsec_...         # server-side only (Edge Function)
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

#### Checkout flow

1. User clicks "Upgrade to Pro" in Settings.
2. Client calls a Supabase Edge Function `POST /functions/v1/create-checkout-session` with the user's JWT and chosen price ID.
3. Edge Function creates a Stripe Checkout Session (with `customer_email`, `success_url`, `cancel_url`, and `client_reference_id = user_id`).
4. Client receives the Checkout URL and opens it in a new tab (`window.open(url, '_blank')`).
5. User completes payment on Stripe's hosted page.
6. Stripe redirects to `success_url` (e.g., `/settings?upgraded=true`).
7. On return, the app detects `?upgraded=true`, re-fetches the profile from Supabase, and updates the plan in the auth store.

#### Stripe webhook (Supabase Edge Function)

**New file:** `supabase/functions/stripe-webhook/index.ts`

Handles these Stripe events:
- `checkout.session.completed` → set `plan = 'pro'`, save `stripe_customer_id`
- `customer.subscription.updated` → sync plan status
- `customer.subscription.deleted` → set `plan = 'free'`

Uses the Stripe SDK to verify the webhook signature before processing. Updates `profiles` using the Supabase service role client (bypasses RLS).

#### Checkout session creator (Supabase Edge Function)

**New file:** `supabase/functions/create-checkout-session/index.ts`

Authenticated endpoint (validates Supabase JWT). Creates a Stripe Checkout Session and returns the URL to the client.

---

### Settings UI Changes

**File:** `src/renderer/src/components/settings/SettingsPage.tsx` and `hooks/useSettingsPage.ts`

1. **Account section** — Add plan badge next to user email (Free / Pro). For free users, add an "Upgrade" link. For pro users, add a "Manage subscription" link to Stripe Customer Portal.

2. **No-account state** — Below the magic link form, add an inline encryption nudge with a `ShieldCheck` icon.

3. **Sync section** — Conditionally render:
   - `plan === 'pro'`: existing sync controls (no change)
   - `plan === 'free'` (logged in): upgrade card replacing sync controls
   - Not logged in: sync section hidden (current behavior)

4. **`useSettingsPage.ts`** — Add `plan` from `useAuthStore`, `handleUpgrade` (opens Checkout), and `handleManageSubscription` (opens Stripe Customer Portal via a new Edge Function or direct portal link).

---

### Verification

1. Create a test account → confirm `profiles` row auto-created with `plan = 'free'`.
2. Confirm sync section shows upgrade card for free account.
3. Complete a Stripe test-mode checkout → confirm webhook fires, `plan` updates to `'pro'` in Supabase.
4. Confirm sync starts working after plan update and app re-fetches profile.
5. Cancel the test subscription in Stripe → confirm webhook fires and `plan` reverts to `'free'`.
6. Confirm RLS blocks sync writes from a free-plan user even with a valid session.
7. Confirm no-account upsell copy renders correctly in Settings.
