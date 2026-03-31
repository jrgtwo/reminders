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

### Phase 7 — Electron Polish ✅
26. ✅ Tray icon + context menu — `src/main/tray.ts`; context menu: Open, New Reminder (navigates to today's day view via IPC), Quit; double-click shows window
27. ✅ System notification scheduler — `src/main/notifications.ts`; polls every 10s; rrule-aware; dedup via fired Set; `NSUserNotificationUsageDescription` added to `electron-builder.yml` for macOS packaged builds
28. ✅ Window state persistence — `src/main/windowState.ts`; saves width/height/x/y to `userData/windowState.json` on close; restored on next launch
29. ✅ Auto-updater — `src/main/updater.ts`; wraps `electron-updater`; skips in dev; downloads silently; prompts Restart Now / Later on update-downloaded

**Navigation IPC:** Tray "New Reminder" sends `navigate` event to renderer via `mainWindow.webContents.send`. Preload exposes `electronAPI.onNavigate(cb)`. `App.tsx` registers the listener and calls `router.navigate(path)`.

**macOS notification note:** `NSUserNotificationUsageDescription` added to `extendInfo` in `electron-builder.yml`. Dev-mode unsigned apps may still be silenced by macOS — this resolves itself once the app is packaged and code-signed.

### Phase 8 — Value-Add ✅
30. ✅ Search — `useSearch.ts` (in-memory filter, ≤5 results per type); `SearchBar.tsx` (forwardRef input + floating results dropdown with Reminders/Todos sections); added to AppShell header
31. ✅ Keyboard shortcuts — `useKeyboardShortcuts.ts` registered in AppShell: `/` focus search, `t` new todo, `n` new reminder (day view), `Ctrl/⌘,` settings; skips when focused in input/textarea/contenteditable
32. ✅ Export/Import JSON — `utils/exportImport.ts`; export fetches all reminders/notes/todos → JSON file; Electron uses native `dialog:save`/`dialog:open` IPC (added to `window.ts` + preload); web uses anchor download + file input fallback; import upserts records and reloads stores
33. ✅ Settings page — `components/settings/SettingsPage.tsx`; dark mode toggle, export/import buttons with status feedback, keyboard shortcut reference; reachable via Settings icon in header or `Ctrl/⌘,`

**Storage layer addition:** `getAllNotes()` added to `IStorageAdapter`, `WebAdapter`, `ElectronAdapter`, `CapacitorAdapter`, `notes.repo.ts`, and notes IPC handler — required for complete data export.

### Bug Fixes & Polish ✅
Post-phase bug fixes identified during manual testing:

- ✅ **Settings — no back navigation**: Added `ArrowLeft` + `useNavigate(-1)` back button to `SettingsPage.tsx`.
- ✅ **Reminder checkbox — no-op**: `toggleComplete` in `reminders.store.ts` was calling `saveReminder(r)` inside the Immer `set()` producer with a draft proxy (revoked after the producer). Fixed by capturing a plain object copy after mutation and saving it outside the producer.
- ✅ **Left sidebar "Add Reminder" — navigated away**: Added `newReminderDate: string | null` + `setNewReminderDate` to `ui.store`. Sidebar now sets the date flag; `AppShell` renders a global `ReminderForm` overlay so the user stays on the calendar view.
- ✅ **Today button — did nothing**: `onToday` in `CalendarPage` only reset local `displayDate` state but not `selectedDate` in the store, leaving the selected-day highlight out of sync. Now also calls `setSelectedDate(today().toString())`.
- ✅ **Calendar — no note indicator**: Added `noteDates: string[]` + `loadNoteDates()` to `notes.store` (calls `getAllNotes()` and stores dates only). `CalendarPage` loads it on mount. `MonthView` and `WeekView` pass `hasNote` to `CalendarDay`, which renders a small `FileText` icon alongside reminder dots for days with a note.

### Phase 9 — Auth + Sync

**Decisions confirmed:**
- Platforms: Electron + Web (Capacitor deferred)
- Auth: Magic link (email OTP) to start; OAuth providers (Google, GitHub) deferred
- Offline-first: app works fully without internet; sync on app focus
- Conflict resolution: auto-merge (field-level last-write-wins; `completedDates` union; notes last-write-wins)
- First login: prompt user when local data and/or cloud data already exists
- Storage: SQLite remains local cache; Supabase is the sync backend (dual-write)

**Architecture**

```
Renderer (React)
  └── lib/supabase.ts        — Supabase client singleton (VITE_ env vars)
  └── store/auth.store.ts    — session, user state, sendMagicLink, signOut
  └── store/sync.store.ts    — sync status, last synced at (Phase 9c)

Main process (Electron)
  └── auth.ts                — deep-link protocol registration, pending callback queue
  └── ipc/auth.ts            — auth:openExternal IPC handler
  └── sync.ts                — SyncEngine class (push/pull/merge) (Phase 9c)
  └── storage/db.ts          — migration: add deleted_at + last_synced_at columns (Phase 9b)

Supabase
  └── Auth                   — magic link (email OTP); OAuth deferred
  └── Database               — reminders, notes, todos tables + user_id + deleted_at (Phase 9b)
  └── Row Level Security     — users can only read/write their own rows (Phase 9b)
```

**Phase 9a — Supabase Auth ✅**

44. ✅ Install `@supabase/supabase-js`; configure `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars; add `envDir` to both Vite configs so vars are found from project root
45. ✅ **Electron deep-link flow** (`src/main/auth.ts`):
    - Register custom protocol `reminders://` via `app.setAsDefaultProtocolClient`
    - `app.requestSingleInstanceLock()` for Windows deep-link support
    - macOS: `app.on('open-url')` catches `reminders://auth/callback` and sends to renderer via IPC
    - Windows: `app.on('second-instance')` extracts URL from argv
    - Pending callback queue for when the URL arrives before the window is ready
    - `auth:openExternal` IPC handler (`src/main/ipc/auth.ts`) — renderer asks main to open OAuth URLs
46. ✅ **Magic link auth** (`src/renderer/src/store/auth.store.ts`):
    - `sendMagicLink(email)`: calls `supabase.auth.signInWithOtp()` with `emailRedirectTo: 'reminders://auth/callback'` (Electron) or `window.location.origin` (web)
    - `init()`: restores session from `localStorage`, subscribes to `onAuthStateChange`, registers deep-link callback handler
    - `signOut()`: clears session
47. ✅ **Settings page — Account section**: email input + "Send link" button; sent confirmation state; signed-in user display with email initial avatar + sign out
48. ✅ CSP updated in `index.html` to allow `connect-src` and `img-src` for `*.supabase.co`

**Phase 9b — Supabase Schema + Local Soft Deletes ✅**

49. ✅ **Supabase tables** (`reminders`, `notes`, `todos`) — mirror SQLite schema plus:
    - `user_id uuid` (FK → `auth.users`, NOT NULL)
    - `deleted_at timestamptz` (null = active; set = soft-deleted)
    - RLS policies: `user_id = auth.uid()` on all CRUD operations
50. ✅ **SQLite migration** (new migration entry in `db.ts`):
    - Add `deleted_at TEXT` column to `reminders`, `notes`, `todos`
    - Add `last_synced_at TEXT` column to track per-row sync state
    - Add `sync_meta` table: `user_id TEXT, last_pull_at TEXT`
    - All delete operations become soft deletes (set `deleted_at`, keep the row)

**Phase 9c — Sync Engine ✅**

51. ✅ New `src/main/sync.ts` — `SyncEngine` class:

```
sync(session, config):
  1. Load lastPullAt from sync_meta for this user
  2. PULL from Supabase: all rows where updated_at > lastPullAt
     - deleted_at set remotely  → soft-delete locally
     - not in local DB          → insert
     - remote updatedAt >= local → overwrite local (union completedDates)
     - local newer               → keep local, still union completedDates
  3. PUSH to Supabase: local rows where last_synced_at IS NULL OR updated_at > last_synced_at
     - upsert each row (including soft-deleted rows)
  4. Update lastPullAt = now in sync_meta
```

52. ✅ IPC: `sync:trigger(session, config)` + `sync:getStatus()` (`src/main/ipc/sync.ts`)
    - Supabase URL + anon key passed from renderer to avoid env var issues in main process
53. ✅ Focus trigger: `window.addEventListener('focus', ...)` in `sync.store.ts` (renderer-side)
    - Also triggers on sign-in via `useAuthStore.subscribe`
54. ✅ New `src/renderer/src/store/sync.store.ts` — holds `status: 'idle' | 'syncing' | 'error'`, `lastSyncedAt`; `init()` called from `App.tsx`

**Phase 9d — First-Login Migration ✅**

55. ✅ `SyncEngine.checkFirstLogin(userId, session, config)` (`src/main/sync.ts`):
    - Reads `sync_meta` — if userId present, returns `{ isFirstLogin: false }` (skips to normal sync)
    - Counts local active rows + remote rows via Supabase `count` API
    - Returns `{ isFirstLogin: true, hasLocal, hasRemote }`
56. ✅ `SyncEngine.markFirstLoginDone(userId)` — inserts userId into `sync_meta` with `last_pull_at = NULL`
57. ✅ IPC: `sync:checkFirstLogin` + `sync:markFirstLoginDone` (`src/main/ipc/sync.ts`)
58. ✅ `FirstLoginDialog` (`src/renderer/src/components/sync/FirstLoginDialog.tsx`):
    - **Local only**: "Upload your local data to the cloud?" → Upload / Skip
    - **Cloud only**: "Download your cloud data to this device?" → Download / Skip
    - **Both exist**: "Merge local and cloud data?" → Merge / Skip
    - **Neither**: silent — marks done + triggers initial sync, no dialog
59. ✅ `sync.store.ts` — `checkFirstLogin()`, `completeMigration('sync'|'skip')`, `migrationCase` state
    - `checkingFirstLogin` flag blocks focus-triggered syncs during the check (race condition fix)
    - `isElectron()` guard — web app silently skips all sync/IPC calls
    - try-catch with `console.error` throughout
60. ✅ `FirstLoginDialog` rendered in `App.tsx`; triggered on sign-in via `useAuthStore.subscribe`

**Phase 9e — Sync Status UI ✅**

58. ✅ Sync indicator in `AppShell` header: `Cloud`/`Loader2`/`CloudOff` icons + "Synced Xm ago" label (hidden on mobile); only renders when logged in
59. ✅ Silent ignore when offline: `trigger()` catch block checks `!navigator.onLine` and `TypeError` fetch errors — sets status back to `'idle'` instead of `'error'`
60. ✅ "Sync now" button in Settings page — Sync section appears when logged in; shows cloud icon, last synced time, spinning `RefreshCw` while syncing
61. ✅ Error state: dismissible red alert banner below AppShell header; re-shows after each new failed sync attempt (tracked via `syncing → error` transition)

**Phase 9 Bug Fixes ✅**

- ✅ **Web sync was a no-op**: `trigger()`, `checkFirstLogin()`, and `completeMigration()` all had `if (!isElectron()) return` guards. Created `src/renderer/src/lib/webSync.ts` — a renderer-side sync engine that uses the `supabase` client singleton + `initStorage()` adapter directly. Implements the same pull/push/merge logic as `src/main/sync.ts`. Tracks `lastPullAt` and first-login state in `localStorage` per user. `sync.store.ts` now branches on `isElectron()` in all three methods.
- ✅ **Storage race condition on web**: On app load, `initAuth()` fires `onAuthStateChange` (restoring session from localStorage) before `initStorage()` resolves, crashing `webCheckFirstLogin` with "Storage not initialized". Fixed by using `initStorage()` (idempotent, awaitable) instead of `getStorage()` inside `webSync.ts`.

### Phase 10 — Testing ✅
34. ✅ Vitest unit tests — `vitest@^3.2` added; `vitest.config.ts` at root; 51 tests in 2 files:
    - `utils/__tests__/recurrence.test.ts` — 18 tests covering non-recurring, daily (interval/endDate/count), weekly (byDay/interval), monthly, yearly
    - `utils/__tests__/dates.test.ts` — 33 tests covering `parseDateStr`/`toDateStr`, `isSameDay/Month`, `addMonths`/`subMonths` (incl. leap-year clamp), `addWeeks`/`subWeeks`, `getMonthGrid` (shape/leap Feb), `getWeekDays`, `formatWeekRange`

---

### Phase 11 — Web Launch
> Focus: get the web app production-ready and deployed.

**Blockers (must be done before launch):**
35. ✅ CAPTCHA — Cloudflare Turnstile added to sign-in form (`@marsidev/react-turnstile`); token passed to `signInWithOtp`
36. Fix CSP in `index.html` — add `challenges.cloudflare.com` to `script-src` and `frame-src` so Turnstile widget loads in production
37. Cloudflare Turnstile dashboard — add production Vercel domain to allowed domains list
38. Vercel env vars — set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CAPTCHA_SITE_KEY` in Vercel project settings
39. Supabase redirect URL — add production Vercel domain to Auth → URL Configuration → Redirect URLs
40. Web deployment — connect repo to Vercel; set build command `npm run build:web`, output dir `dist/renderer/`

**Nice to have:**
41. Supabase auth email templates — replace default Supabase branding with app name/logo
42. Favicon — add `<link rel="icon">` to `index.html`
43. HTML meta tags — add `<meta name="description">` and viewport meta tag to `index.html`

---

### Phase 12 — Packaging & CI — DEFERRED
> After web launch.
38. electron-builder configs: Windows NSIS installer, macOS DMG
39. Playwright e2e tests (renderer in browser)
40. GitHub Actions CI: lint → typecheck → test → build matrix (Windows + macOS)

---

### Phase 13 — Mobile (Capacitor) — DEFERRED
> Complete once the app is functionally stable. No work needed until then.
38. `npx cap add ios` + `npx cap add android` (creates native projects)
39. Implement `CapacitorAdapter` using `@capacitor-community/sqlite` (same schema as Electron)
40. `@capacitor/local-notifications` for reminder alerts
41. `@capacitor/status-bar`, `@capacitor/splash-screen` for native polish
42. Test on iOS Simulator (Xcode required, macOS only) and Android Emulator
43. App Store / Google Play build signing config in `capacitor.config.ts`

---

## Critical Files

**Renderer (shared web + Electron)**
- `src/renderer/src/platform/types.ts` — `IStorageAdapter` interface; central abstraction; all adapters must satisfy this
- `src/renderer/src/platform/index.ts` — 3-way adapter selection (Electron → Capacitor → Web)
- `src/renderer/src/platform/capacitor.ts` — stub adapter; replace with real impl in Phase 10
- `src/renderer/src/store/ui.store.ts` — sidebar state, selected date, view mode, dark mode, keyboard trigger flags, `newReminderDate` for global form
- `src/renderer/src/components/layout/AppShell.tsx` — top header (search + settings + sync indicator), responsive 3-col layout, keyboard shortcuts, global new-reminder form overlay, sync error banner
- `src/renderer/src/hooks/useKeyboardShortcuts.ts` — all keyboard shortcuts; registered once in AppShell
- `src/renderer/src/utils/exportImport.ts` — export/import logic; relies on `getAllNotes()` for complete data export
- `src/renderer/src/lib/webSync.ts` — renderer-side sync engine for web; mirrors `src/main/sync.ts`; uses Supabase client + `initStorage()` adapter; tracks state in `localStorage`
- `src/renderer/src/store/sync.store.ts` — sync status, `lastSyncedAt`, first-login flow; branches on `isElectron()` for all sync operations

**Main process (Electron)**
- `src/main/storage/db.ts` — SQLite init + migration runner; prerequisite for all IPC handlers
- `src/main/tray.ts` — system tray icon + context menu; sends `navigate` IPC to renderer
- `src/main/notifications.ts` — 10s poll scheduler; rrule-aware; fires native OS notifications
- `src/main/windowState.ts` — persists window bounds to `userData/windowState.json`
- `src/main/updater.ts` — electron-updater wiring; skips in dev; silent download + restart dialog

**Config**
- `src/preload/index.ts` — contextBridge surface; must stay in sync with IPC handlers and `ElectronAdapter`
- `electron.vite.config.ts` — triple-target build config; incorrect externalization causes runtime crashes
- `electron-builder.yml` — packaging config; `NSUserNotificationUsageDescription` required for macOS notifications
- `capacitor.config.ts` — points Capacitor at `dist/renderer`; required before `npx cap add ios/android` in Phase 10

---

## Verification

- **Web dev**: `npm run dev:web` → open browser at localhost → full app with IndexedDB persistence
- **Electron dev**: `npm run dev` → Electron window opens with HMR; test IPC data flow via DevTools console
- **Web build**: `npm run build:web` → deploy `dist/renderer/` to Netlify/Vercel → verify IndexedDB works in production
- **Electron package**: `npm run build:mac` / `npm run build:win` → install DMG/NSIS → verify notifications, tray, SQLite persistence, auto-updater
- **Tests**: `npm test` → Vitest unit tests pass; `npm run test:e2e` → Cypress tests pass
- **Capacitor scaffold**: `npx cap doctor` → reports `@capacitor/core` installed, no native platforms yet (expected at this stage)
