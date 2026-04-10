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
