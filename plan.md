# Reminders App — Implementation Plan

## Context

Building a greenfield reminder/notes/calendar app from scratch in `/home/jonat/projects/reminders`. The app must work as both a deployable web app (IndexedDB storage) and a native Electron desktop app for Windows + macOS (SQLite storage). The same React renderer codebase is shared across both targets via a platform storage adapter abstraction.

Capacitor scaffolding for iOS/Android is included from the start so the mobile path is ready to complete later without restructuring the codebase.

**User decisions confirmed:**
- Local-only storage (no backend/auth/sync)
- Web version is deployable (Vercel/Netlify, IndexedDB for persistence)
- Todos are simple (title, description, completed, drag-to-reorder)
- Reminders support recurrence (daily/weekly/monthly/yearly via rrule)
- Capacitor scaffolded now; full iOS/Android integration deferred until app is functional

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Build | `electron-vite` | Handles main + preload + renderer in one config; HMR across all three |
| UI | React 19 + TypeScript | Modern, stable |
| Styling | Tailwind CSS v4 + `@tailwindcss/vite` | No PostCSS config needed; class-based dark mode |
| State | Zustand 5 + immer | No provider boilerplate; `persist` middleware; simple per-domain stores |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Actively maintained; works in Electron renderer; accessible |
| Calendar | Custom (CSS Grid) | ~200 lines; no bundle weight; perfect Tailwind integration |
| Notes editor | Milkdown v7 | ProseMirror-based; Markdown string output; React integration via `@milkdown/react` |
| Date utils | Temporal API (`@js-temporal/polyfill`) | Standard API; no mutation; precise calendar arithmetic |
| Recurrence | `rrule` | RFC 5545 compliant; handles all edge cases |
| Routing | React Router v7 | `createBrowserRouter` for web; `createMemoryRouter` for Electron/Capacitor |
| Web storage | `idb` 8 (IndexedDB) | Promise-based; typed; indexed queries |
| Electron storage | `better-sqlite3` | Synchronous; WAL mode; FTS5 search |
| Mobile (future) | `@capacitor-community/sqlite` | Same SQL schema as Electron; swap in when ready |
| Mobile scaffold | `@capacitor/core` + `@capacitor/cli` | Config + stub adapter added now; native projects added later |
| Icons | `lucide-react` | Consistent, tree-shakeable |
| Testing | Vitest + Playwright | Unit + e2e |
| Packaging | `electron-builder` | Windows NSIS + macOS DMG |

---

## Project Structure

```
reminders/
├── electron.vite.config.ts
├── vite.web.config.ts          # web-only build (renderer only)
├── capacitor.config.ts         # Capacitor config (scaffold only — no native projects yet)
├── package.json
├── tsconfig.json               # base
├── tsconfig.node.json          # main + preload (Node target)
├── tsconfig.web.json           # renderer (DOM target)
├── tailwind.config.ts
│
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.ts            # app lifecycle, window, tray
│   │   ├── ipc/
│   │   │   ├── reminders.ts
│   │   │   ├── notes.ts
│   │   │   └── todos.ts
│   │   ├── storage/
│   │   │   ├── db.ts           # better-sqlite3 init + migrations
│   │   │   ├── reminders.repo.ts
│   │   │   ├── notes.repo.ts
│   │   │   └── todos.repo.ts
│   │   ├── notifications.ts    # 60s interval scheduler
│   │   └── tray.ts
│   │
│   ├── preload/
│   │   └── index.ts            # contextBridge API surface
│   │
│   └── renderer/               # React app (shared web + Electron)
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx             # router + storage init
│       │
│       ├── platform/           # THE abstraction layer
│       │   ├── types.ts        # IStorageAdapter interface
│       │   ├── index.ts        # 3-way detection: Electron → Capacitor → Web
│       │   ├── electron.ts     # wraps window.electronAPI IPC calls
│       │   ├── capacitor.ts    # STUB — throws NotImplemented (complete later)
│       │   └── web.ts          # wraps idb IndexedDB
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx         # responsive: 3-col on desktop, bottom-nav on mobile
│       │   │   ├── LeftSidebar.tsx      # collapsible, upcoming reminders (hidden on mobile)
│       │   │   ├── RightSidebar.tsx     # todos list (hidden on mobile)
│       │   │   ├── BottomNav.tsx        # mobile-only tab bar (Calendar/Todos/Reminders)
│       │   │   └── TitleBar.tsx         # Electron custom chrome only
│       │   ├── calendar/
│       │   │   ├── MonthView.tsx        # CSS Grid 7x6
│       │   │   ├── WeekView.tsx         # CSS Grid 7 cols strip
│       │   │   ├── CalendarDay.tsx      # cell with event dots
│       │   │   └── CalendarHeader.tsx   # nav + view switcher
│       │   ├── reminders/
│       │   │   ├── ReminderList.tsx
│       │   │   ├── ReminderItem.tsx
│       │   │   ├── ReminderForm.tsx     # dialog
│       │   │   └── RecurrenceEditor.tsx # frequency/interval/end UI
│       │   ├── notes/
│       │   │   └── NoteEditor.tsx       # Tiptap editor
│       │   ├── todos/
│       │   │   ├── TodoList.tsx         # @dnd-kit sortable wrapper
│       │   │   ├── TodoItem.tsx         # drag handle + checkbox
│       │   │   └── TodoForm.tsx         # dialog
│       │   └── ui/                      # shared primitives
│       │       ├── Button.tsx
│       │       ├── Dialog.tsx
│       │       ├── Input.tsx
│       │       └── Badge.tsx
│       │
│       ├── store/
│       │   ├── reminders.store.ts
│       │   ├── notes.store.ts
│       │   ├── todos.store.ts
│       │   └── ui.store.ts       # sidebar open, view, selectedDate, darkMode
│       │
│       ├── hooks/
│       │   ├── useKeyboardShortcuts.ts
│       │   └── useSearch.ts
│       │
│       ├── types/
│       │   └── models.ts
│       │
│       └── utils/
│           ├── recurrence.ts    # rrule helpers
│           ├── dates.ts         # date-fns wrappers
│           └── order.ts         # float-gap reorder logic
│
└── resources/
    ├── icon.png / icon.ico
    └── trayIcon.png
```

---

## Data Models

```typescript
// src/renderer/types/models.ts

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number          // every N units
  endDate?: string          // 'YYYY-MM-DD', undefined = forever
  count?: number            // end after N occurrences
  byDay?: number[]          // 0-6 (Sun-Sat), for weekly
}

export interface Reminder {
  id: string                // crypto.randomUUID()
  title: string
  description?: string
  date: string              // 'YYYY-MM-DD' base date
  time?: string             // 'HH:MM', for timed reminders + notifications
  recurrence?: RecurrenceRule
  completedDates: string[]  // ISO dates of completed occurrences
  createdAt: string
  updatedAt: string
}

export interface Note {
  date: string              // 'YYYY-MM-DD' primary key (one note per day)
  content: string           // Markdown string (Milkdown)
  updatedAt: string
}

export interface Todo {
  id: string
  title: string
  description?: string
  order: number             // float gap (1000, 2000...) for O(1) reorder
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}
```

**Todo order strategy:** Use float gaps (1000, 2000, 3000...). On drop between A and B: `order = (A.order + B.order) / 2`. Renumber entire list only when precision runs out (~50 consecutive inserts between same pair).

**Recurring reminders:** Store one record with `RecurrenceRule`. Never pre-expand to rows. Use `rrule.between(start, end)` at query time to find occurrences in range. Track completions as an array of ISO date strings on the parent record.

---

## Storage Adapter Interface

```typescript
// src/renderer/platform/types.ts
export interface IStorageAdapter {
  // Reminders
  getReminders(): Promise<Reminder[]>
  getRemindersByDate(date: string): Promise<Reminder[]>
  saveReminder(r: Reminder): Promise<Reminder>
  deleteReminder(id: string): Promise<void>

  // Notes
  getNoteByDate(date: string): Promise<Note | null>
  saveNote(n: Note): Promise<Note>

  // Todos
  getTodos(): Promise<Todo[]>
  saveTodo(t: Todo): Promise<Todo>
  deleteTodo(id: string): Promise<void>
  reorderTodos(ids: string[]): Promise<void>
}
```

**Web adapter** (`platform/web.ts`): `idb` with three object stores: `reminders` (index on `date`), `notes` (keyed by `date`), `todos` (index on `order`). Schema version via `openDB` version param.

**Electron adapter** (`platform/electron.ts`): Thin wrapper that calls `window.electronAPI.*` (IPC invoke). All real work happens in the main process SQLite repos.

**Capacitor adapter** (`platform/capacitor.ts`): Scaffolded stub that satisfies `IStorageAdapter` but throws `new Error('Capacitor storage not yet implemented')` on every method. Detected via `Capacitor.isNativePlatform()` from `@capacitor/core`. When mobile integration is ready, replace stub with `@capacitor-community/sqlite` calls using the same SQL schema as Electron.

**Selection** (`platform/index.ts`): 3-way priority — Electron (checks `window.electronAPI`) → Capacitor (checks `Capacitor.isNativePlatform()`) → Web (IndexedDB fallback). Dynamic imports keep all three adapters tree-shaken per platform.

```typescript
// src/renderer/platform/index.ts  (outline)
export async function initStorage(): Promise<IStorageAdapter> {
  if (window?.electronAPI) {
    const { ElectronAdapter } = await import('./electron')
    return new ElectronAdapter()
  }
  const { Capacitor } = await import('@capacitor/core')
  if (Capacitor.isNativePlatform()) {
    const { CapacitorAdapter } = await import('./capacitor')
    return new CapacitorAdapter()   // stub — throws until Phase 10
  }
  const { WebAdapter } = await import('./web')
  const a = new WebAdapter()
  await a.init()
  return a
}
```

---

## SQLite Schema (Electron)

```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,          -- 'YYYY-MM-DD'
  time TEXT,                   -- 'HH:MM' nullable
  recurrence TEXT,             -- JSON RecurrenceRule, nullable
  completed_dates TEXT NOT NULL DEFAULT '[]',  -- JSON string[]
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_reminders_date ON reminders(date);

CREATE TABLE notes (
  date TEXT PRIMARY KEY,
  content TEXT NOT NULL,       -- Markdown string
  updated_at TEXT NOT NULL
);

CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sort_order REAL NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_todos_order ON todos(sort_order);

CREATE TABLE schema_version (version INTEGER PRIMARY KEY);
```

Migrations: array of SQL strings, applied sequentially in a transaction. Version tracked in `schema_version` table. Startup reads version, runs all pending migrations, updates version.

---

## App Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Custom TitleBar — Electron only]                           │
├──────────┬───────────────────────────────────┬──────────────┤
│ LEFT     │                                   │ RIGHT        │
│ SIDEBAR  │   MAIN CONTENT                    │ SIDEBAR      │
│ [w-64]   │                                   │ [w-72]       │
│ or [w-12]│  Month/Week View: CSS Grid        │              │
│          │    CalendarDay cells               │  Todos       │
│ Upcoming │    event indicator dots            │  [drag grip] │
│ reminder │    click → DayView                 │  [ ] item 1  │
│ items    │                                   │  [ ] item 2  │
│          │  Day View:                         │  [ ] item 3  │
│ [≪] btn  │    Tiptap NoteEditor               │              │
│          │    ReminderList for date           │  [+ Add]     │
│ [+ Add]  │    [+ Add Reminder]               │              │
└──────────┴───────────────────────────────────┴──────────────┘
```

- Left sidebar collapses to `w-12` icon strip (not hidden entirely); animated via `transition-[width]`
- Right sidebar collapses to `w-0 overflow-hidden`
- Sidebar state in `ui.store.ts`: `leftOpen`, `rightOpen`, `currentView`, `selectedDate`, `darkMode`
- Routing: `createMemoryRouter` for Electron + Capacitor, `createBrowserRouter` for web
- Routes: `/` (calendar), `/day/:date` (day detail), `/settings`

**Responsive / mobile layout:**
- `AppShell` uses `md:flex-row flex-col` — sidebars visible on `md+`, hidden on mobile
- On mobile (`< md`): single-column with `BottomNav` tab bar (Calendar | Reminders | Todos)
- `BottomNav` is rendered only when `Capacitor.isNativePlatform()` or viewport `< 768px`
- This means the responsive layout works in a mobile browser too, not just Capacitor

---

## Electron IPC Bridge

```typescript
// preload/index.ts — contextBridge surface
contextBridge.exposeInMainWorld('electronAPI', {
  reminders: {
    getAll:    ()          => ipcRenderer.invoke('reminders:getAll'),
    getByDate: (date)      => ipcRenderer.invoke('reminders:getByDate', date),
    save:      (r)         => ipcRenderer.invoke('reminders:save', r),
    delete:    (id)        => ipcRenderer.invoke('reminders:delete', id),
  },
  notes: {
    getByDate: (date)      => ipcRenderer.invoke('notes:getByDate', date),
    save:      (n)         => ipcRenderer.invoke('notes:save', n),
  },
  todos: {
    getAll:    ()          => ipcRenderer.invoke('todos:getAll'),
    save:      (t)         => ipcRenderer.invoke('todos:save', t),
    delete:    (id)        => ipcRenderer.invoke('todos:delete', id),
    reorder:   (ids)       => ipcRenderer.invoke('todos:reorder', ids),
  },
})
```

BrowserWindow settings: `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`.

---

## Electron Platform Features

**System notifications:** `Notification` API from `electron` (native OS). Scheduler: `setInterval` every 60s in main process, queries SQLite for reminders where `date = today AND time = HH:MM` and the occurrence is not in `completed_dates`. Fires native notification.

**Tray icon:** Context menu with "Open", "New Reminder", separator, "Quit". macOS always visible; Windows system tray.

**Window state:** Persist `width`, `height`, `x`, `y` to a small JSON file via `electron-store` (appropriate for this tiny config use case, separate from SQLite).

**Auto-updater:** `electron-updater` via GitHub Releases. Checks on launch in production, downloads in background, prompts user to restart.

**Custom title bar:** `titleBarStyle: 'hiddenInset'` on macOS, `'hidden'` on Windows with custom draggable region and min/max/close buttons in renderer.

---

## Key Feature Details

### Calendar (Custom)
- `MonthView`: `display: grid; grid-template-columns: repeat(7, 1fr)` — 42 cells (6 rows × 7 cols). Each `CalendarDay` shows: date number, colored dots for reminders (up to 3, then "+N more"), today highlight, selected-day highlight.
- `WeekView`: Same grid but 7 cells, 1 row — simpler strip with more detail per day.
- Navigation: prev/next arrows + "Today" button + month/week/day toggle.

### Recurring Reminders
- `RecurrenceEditor` component: frequency dropdown → interval stepper → end condition (never / on date / after N occurrences) → day-of-week checkboxes (weekly only).
- At query time: construct `RRule` from stored `RecurrenceRule`, call `rule.between(monthStart, monthEnd)` to get dates with reminders for calendar display. Same for the left sidebar "upcoming" view (next 30 days).
- Completion: toggle adds/removes the specific ISO date string from `completedDates[]` on the reminder record.

### Drag-and-Drop Todos
- `@dnd-kit/sortable` `SortableContext` wraps `TodoList`.
- Each `TodoItem` uses `useSortable` hook with a visible drag grip icon.
- `onDragEnd`: compute new float order, call `reorderTodos` on the store which calls the adapter.

### Search
- Keyboard shortcut `/` focuses a `<input>` in the header.
- Web: in-memory filter over loaded store state (title + description substring match).
- Electron: SQLite FTS5 virtual table:
  ```sql
  CREATE VIRTUAL TABLE search_idx USING fts5(
    id UNINDEXED, type UNINDEXED, date UNINDEXED,
    title, content, tokenize='unicode61'
  );
  ```
  Populated on insert/update via triggers or explicit repo calls.

### Dark Mode
- `ui.store.ts` holds `darkMode: boolean`, persisted to `localStorage`.
- On toggle: `document.documentElement.classList.toggle('dark', isDark)`.
- Tailwind `darkMode: 'class'` in config.

### Keyboard Shortcuts
- `useKeyboardShortcuts` hook via `document.addEventListener('keydown')`.
- `n` → new reminder (on day view), `t` → new todo, `/` → search focus, `←/→` → prev/next month, `Esc` → close modal / back to calendar, `Cmd/Ctrl+,` → settings.

### Export / Import
- Export: serialize all store data to JSON with `{ schemaVersion, reminders, notes, todos }`. Web: File System Access API (`showSaveFilePicker`). Electron: `dialog.showSaveDialog`.
- Import: parse JSON, validate with Zod, upsert into storage adapter.

---

## Build Scripts

```json
{
  "scripts": {
    "dev":              "electron-vite dev",
    "build":            "electron-vite build",
    "build:web":        "vite build --config vite.web.config.ts",
    "package":          "electron-vite build && electron-builder",
    "package:win":      "electron-vite build && electron-builder --win",
    "package:mac":      "electron-vite build && electron-builder --mac",
    "postinstall":      "electron-builder install-app-deps",
    "cap:sync":         "npm run build:web && npx cap sync",
    "cap:open:ios":     "npx cap open ios",
    "cap:open:android": "npx cap open android",
    "lint":             "eslint src --ext .ts,.tsx",
    "typecheck":        "tsc --noEmit",
    "test":             "vitest run",
    "test:e2e":         "playwright test"
  }
}
```

`better-sqlite3` in `optionalDependencies` — compiled against Electron ABI via `postinstall`. Web bundle never imports it. `cap:sync`, `cap:open:ios`, and `cap:open:android` are defined now but will fail until native projects are added via `npx cap add ios` / `npx cap add android` (deferred).

---

## Implementation Order

### Phase 1 — Foundation ✅
1. ✅ Scaffold project with `electron-vite` React+TypeScript template
2. ✅ Configure Tailwind v4, TypeScript triple-config, ESLint, Prettier
3. ✅ Define all data models (`src/renderer/types/models.ts`)
4. ✅ Implement `IStorageAdapter` interface + all three adapters: web (IndexedDB), electron (IPC), capacitor (**stub**)
5. ✅ Add `capacitor.config.ts` pointing `webDir` at `dist/renderer`; install `@capacitor/core` + `@capacitor/cli`
6. ✅ Set up preload contextBridge + main IPC handlers + SQLite schema/migrations
7. ✅ Wire Zustand stores (data layer only, no UI)

### Phase 2 — Layout Shell ✅
8. ✅ `AppShell` responsive layout: `md:flex-row` 3-col on desktop, `flex-col` + `BottomNav` on mobile
9. ✅ `LeftSidebar` + `RightSidebar` collapse logic (both collapse to `w-12` icon strip)
10. ✅ `BottomNav` tab bar component (Calendar / Reminders / Todos)
11. ✅ Dark mode toggle wired to `ui.store.ts`
12. ✅ Native OS title bar kept (no custom chrome — looks correct on Windows/macOS when packaged)

### Phase 3 — Calendar ✅
11. ✅ `MonthView` CSS Grid + `CalendarDay` with event dots
12. ✅ `WeekView`
13. ✅ `CalendarHeader` nav (prev/next, today, view switcher)
14. ✅ Click day → DayView navigation

### Phase 4 — Day View ✅
15. ✅ `DayView` page layout
16. ✅ Milkdown `NoteEditor` integration
    - GFM preset (`@milkdown/preset-gfm`) — CommonMark + strikethrough, tables, task lists
    - Full toolbar: Undo, Redo, H1–H3, Bold, Italic, Strikethrough, Bullet list, Ordered list, Blockquote, Inline code, Code block, HR, Link
    - Responsive overflow: `ResizeObserver` moves items that don't fit into a `...` dropdown
    - Link button opens an inline URL input row below the toolbar
    - Debounced autosave (800ms); `Note.content` stored as Markdown string
    - Toolbar commands dispatched via `get()?.action(callCommand(command.key, payload))` — the correct Milkdown v7 API
    - Slash/notion-style command menu considered and deferred (not planned)
17. ✅ `ReminderList` + `ReminderItem` for selected day
18. ✅ `ReminderForm` dialog (CRUD)
19. ✅ `RecurrenceEditor` component

**Shared UI primitives built:** `Button`, `Dialog`, `Input`, `Badge`

**Infrastructure changes:**
- Added `dev:web` script (`vite --config vite.web.config.ts`) — primary dev target during development
- Fixed `electron.vite.config.ts`: explicitly externalized `better-sqlite3` (was in `optionalDependencies`, missed by electron-vite's auto-externalization)
- `Note.content` type changed from `object` (Tiptap JSON) to `string` (Markdown)

### Phase 5 — Todos ✅
20. ✅ `TodoList` with `@dnd-kit/sortable` — `DndContext` + `SortableContext`, `PointerSensor` with 5px activation constraint, `arrayMove` on drag end
21. ✅ `TodoItem` with drag grip + checkbox — hover-reveal grip/actions, expandable description panel with chevron toggle
22. ✅ `TodoForm` dialog — monospace `<textarea>` for description with markdown hint in label
23. ✅ Float-order persistence on drag end — `reorderTodos` called with new ID sequence; store recomputes `order` as `(i+1)*1000`

**Additions beyond original scope:**
- `ui/MarkdownView.tsx` — reusable read-only Milkdown component (`editorViewOptionsCtx` `editable: () => false`); used to render todo descriptions as GFM markdown in the expanded panel

### Phase 6 — Left Sidebar Reminders ✅
24. ✅ Upcoming reminders query (next 30 days, rrule expansion) — `getOccurrencesInRange` used to expand recurring reminders; flat list sorted by date
25. ✅ Scrollable list, click navigates to that day — relative date labels (Today / Tomorrow / Mon Mar 23); "Add Reminder" button navigates to today's day view

### Phase 7 — Electron Polish
26. Tray icon + context menu
27. ⚠️ System notification scheduler — implemented (`src/main/notifications.ts`, polls every 10s, rrule-aware, dedup via fired Set); **macOS Electron notifications not firing** — likely a missing `NSUserNotificationUsageDescription` entitlement or the app not being code-signed; needs investigation before marking complete
28. Window state persistence
29. Auto-updater integration

**Known issues:**
- **macOS Electron notifications silent:** Native `Notification` from the `electron` module fires no visible alert. Root cause not yet confirmed — candidates: (1) missing `NSUserNotificationUsageDescription` key in `entitlements.plist`, (2) unsigned/unpackaged app in dev mode bypasses macOS notification permissions, (3) `Notification.isSupported()` returns false silently. Investigate by calling `Notification.isSupported()` in main process on startup and logging the result; also check System Settings → Notifications for the app entry.

### Phase 8 — Value-Add
30. Search (header input + FTS5/in-memory)
31. Keyboard shortcuts
32. Export/Import JSON
33. Settings page

### Phase 9 — Testing & Packaging
34. Vitest unit tests (recurrence logic, date utils, storage repos)
35. Playwright e2e tests (renderer in browser)
36. GitHub Actions CI: lint → typecheck → test → build matrix (Windows + macOS)
37. electron-builder configs: Windows NSIS installer, macOS DMG

### Phase 10 — Mobile (Capacitor) — DEFERRED
> Complete once the app is functionally stable. No work needed until then.
38. `npx cap add ios` + `npx cap add android` (creates native projects)
39. Implement `CapacitorAdapter` using `@capacitor-community/sqlite` (same schema as Electron)
40. `@capacitor/local-notifications` for reminder alerts
41. `@capacitor/status-bar`, `@capacitor/splash-screen` for native polish
42. Test on iOS Simulator (Xcode required, macOS only) and Android Emulator
43. App Store / Google Play build signing config in `capacitor.config.ts`

---

## Critical Files

- `src/renderer/platform/types.ts` — `IStorageAdapter` interface; central abstraction; must be finalized before any store or component
- `src/renderer/platform/index.ts` — 3-way adapter selection (Electron → Capacitor → Web); controls which storage path runs
- `src/renderer/platform/capacitor.ts` — stub adapter; satisfies the interface now; replace with real impl in Phase 10
- `capacitor.config.ts` — points Capacitor at `dist/renderer`; required before `npx cap add ios/android` in Phase 10
- `src/renderer/store/ui.store.ts` — sidebar state, selected date, view mode, dark mode; read by nearly every layout component
- `src/renderer/components/layout/AppShell.tsx` — responsive breakpoint logic; determines whether sidebars or BottomNav render
- `src/main/storage/db.ts` — SQLite init + migration runner; prerequisite for all Electron IPC handlers
- `src/preload/index.ts` — contextBridge surface; must stay in sync with IPC handlers and `ElectronAdapter`
- `electron.vite.config.ts` — triple-target build config; incorrect externalization causes runtime crashes

---

## Verification

- **Web dev**: `npm run dev` → open browser at localhost → full app in browser with IndexedDB persistence
- **Electron dev**: `npm run dev` → Electron window opens with HMR; test IPC data flow via DevTools console
- **Web build**: `npm run build:web` → deploy `dist/renderer/` to Netlify/Vercel → verify IndexedDB works in production
- **Electron package**: `npm run package:mac` / `npm run package:win` → install DMG/NSIS → verify notifications, tray, SQLite persistence, auto-updater
- **Tests**: `npm test` → Vitest unit tests pass; `npm run test:e2e` → Playwright tests pass
- **Capacitor scaffold**: `npx cap doctor` → reports `@capacitor/core` installed, no native platforms yet (expected at this stage)
