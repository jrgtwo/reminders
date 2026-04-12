# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reminder Today** is a local-first, cross-platform productivity app (calendar, reminders, notes, todos) with end-to-end encrypted cloud sync. It runs as an Electron desktop app, a web app (Vite), and a mobile app (Capacitor). The backend is Supabase (PostgreSQL + Auth).

## Commands

```bash
# Development
npm run dev          # Electron dev server
npm run dev:web      # Web dev server (Vite)

# Building
npm run build        # Typecheck + Electron build
npm run build:web    # Web production build
npm run build:mac    # macOS desktop app
npm run build:win    # Windows desktop app

# Type checking
npm run typecheck        # Full (node + web)
npm run typecheck:node   # Electron/main only
npm run typecheck:web    # Renderer only

# Lint & format
npm run lint
npm run format

# Testing
npm run test                                              # Vitest single run
npx vitest                                                # Watch mode
npx vitest run src/renderer/src/utils/__tests__/dates.test.ts  # Single file
npx vitest run -t "test name"                             # Single test by name
npm run test:e2e                                          # Cypress E2E

# Mobile
npm run cap:sync        # Sync web build to Capacitor
npm run db:schema       # Regenerate Supabase TypeScript types
```

## Architecture

### Platform Targets

The renderer code (`src/renderer/`) runs identically on all three platforms. Platform differences are abstracted in `src/renderer/src/platform/`:

- `electron.ts` — SQLite via IPC calls to main process
- `web.ts` — IndexedDB
- `capacitor.ts` — Capacitor storage
- `encryptedAdapter.ts` — Decorator that wraps any adapter with transparent AES-256-GCM encryption
- `index.ts` — `initStorage()` picks the right adapter at startup

### Data Flow

```
User Action → Zustand Store → EncryptedAdapter → Storage Adapter (SQLite/IndexedDB) → Supabase sync
```

All writes go local first. Background sync (30s polling) pushes encrypted ciphertext to Supabase. Pull merges remote changes. Soft deletes via `deleted_at` prevent resurrection.

### Electron Process Architecture

- `src/main/` — Main process: window management, IPC handlers, SQLite (`db.ts`), `SyncEngine` (`sync.ts`), notifications, system tray, auth, auto-updater
- `src/preload/index.ts` — Exposes safe IPC API bridge to renderer
- `src/renderer/` — React app (shared across all platforms)

### State Management

Zustand stores in `src/renderer/src/store/`:
- `reminders.store.ts`, `notes.store.ts`, `todo_lists.store.ts` — CRUD for each data type
- `auth.store.ts` — Auth + encryption key lifecycle
- `sync.store.ts` — Sync orchestration (polling, migration, first-login decisions)
- `ui.store.ts` — Theme, view mode, selected date

### Database (Electron)

SQLite at `{userData}/reminders.db`. Schema versioned via `schema_version` table (8 migrations as of now). Tables: `reminders`, `notes`, `note_folders`, `todos`, `todo_lists`, `todo_list_items`, `todo_folders`, `sync_meta`. WAL mode enabled.

### Encryption

AES-256-GCM using the Web Crypto API. One key per user stored in Supabase `user_keys` (RLS-protected), cached locally. Encrypted fields use the sentinel format `enc:iv.ciphertext` (base64). Only text fields are encrypted — dates, IDs, timestamps stay plaintext for querying. Key management is in `src/renderer/src/lib/keyManager.ts` and `keyRotation.ts`.

### Cookie Consent

All cookies, analytics, and tracking must go through the consent system in `src/renderer/src/lib/consent.ts`. Two categories exist: `functional` (always on) and `analytics` (opt-in). On Electron/Capacitor, consent is auto-granted and the banner never shows. On web, the `CookieBanner` component (`src/renderer/src/components/CookieBanner.tsx`) collects user consent before any non-essential cookies or tracking loads.

- **Adding a new cookie or tracking pixel**: gate it behind `isAllowed('analytics')` (or `'functional'` if essential) and react to changes via `onConsentChange()`.
- **Adding a new consent category**: add it to the `ConsentCategory` type in `consent.ts` and add a toggle row in `CookieBanner.tsx`.
- **Never** initialize analytics, tracking scripts, or non-essential cookies at module load time — wait for consent.

### Dates

All date logic uses the **Temporal API** (`@js-temporal/polyfill`). Utilities are in `src/renderer/src/utils/dates.ts`. Recurrence uses RRule (`src/renderer/src/utils/recurrence.ts`).

## Code Style

- **Prettier**: single quotes, no semicolons, 100-char print width, no trailing commas
- **Imports**: `@renderer` alias for renderer code; group Node → external → internal
- **TypeScript**: strict mode; `interface` for object shapes, `type` for unions/primitives; explicit return types on exported functions
- **Naming**: PascalCase components/files, camelCase functions/variables, UPPER_SNAKE_CASE constants; private members prefixed with `_`
- **Components**: functional only, destructure props in signature, Zustand for global state
- **Tests**: `__tests__/` subdirectory or `.test.ts` suffix; describe/it/test with Arrange-Act-Assert

## Environment

Copy `.env.example` to `.env` and fill in Supabase URL/key + optional PostHog/Turnstile keys.
