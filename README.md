# Reminders

A local-first reminders, notes, and calendar app. No accounts, no cloud sync, no subscription — your data stays on your device.

Runs as a native desktop app on Windows and macOS (Electron), a deployable web app (IndexedDB), and is scaffolded for future iOS/Android support (Capacitor).

---

## Features

- **Calendar** — Month and week views with reminder indicator dots. Click any day to open the day view.
- **Reminders** — Create one-off or recurring reminders (daily, weekly, monthly, yearly). One record per series via RFC 5545 rrule; per-occurrence completion tracking.
- **Notes** — A rich Markdown note per day via Milkdown (ProseMirror). Supports headings, bold, italic, strikethrough, lists, blockquotes, tables, code blocks, and links. Full toolbar with responsive overflow. Autosaves on every keystroke (800ms debounce).
- **Todos** — Persistent list with drag-to-reorder (float-gap ordering). Expandable descriptions rendered as Markdown.
- **Search** — Live in-memory filter across all reminders and todos, accessible from the header or via `/`.
- **Export / Import** — Full JSON backup and restore (all reminders, notes, and todos).
- **Dark mode** — Toggle persisted across sessions.
- **Keyboard shortcuts** — Full keyboard navigation (see below).
- **Electron extras** — System tray, native OS notifications at scheduled times, window state persistence, background auto-updater.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| Build system | [electron-vite](https://electron-vite.org/) — unified HMR across main, preload, and renderer |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State | [Zustand](https://zustand-demo.pmnd.rs/) 5 + immer |
| Routing | React Router v7 — `MemoryRouter` for Electron/Capacitor, `BrowserRouter` for web |
| Rich text | [Milkdown](https://milkdown.dev/) v7 (ProseMirror, Markdown string output) |
| Drag-and-drop | [@dnd-kit](https://dndkit.com/) |
| Recurrence | [rrule](https://github.com/jakubroztocil/rrule) — RFC 5545 compliant |
| Date math | Temporal API (`@js-temporal/polyfill`) |
| Desktop storage | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — WAL mode |
| Web storage | [idb](https://github.com/jakearchibald/idb) — typed IndexedDB wrapper |
| Mobile (future) | [Capacitor](https://capacitorjs.com/) — scaffold in place, full integration deferred |
| Icons | [Lucide React](https://lucide.dev/) |
| Packaging | [electron-builder](https://www.electron.build/) — Windows NSIS, macOS DMG, Linux AppImage |

---

## Architecture

The same React renderer codebase runs across all platforms. A **storage adapter abstraction** (`src/renderer/src/platform/`) handles the differences:

- **Electron** — IPC calls to the main process, which reads/writes SQLite via `better-sqlite3`
- **Web** — IndexedDB via `idb`
- **Capacitor** — Stubbed; will use `@capacitor-community/sqlite` with the same schema as Electron

Platform is detected at runtime (Electron → Capacitor → Web) and the correct adapter is loaded via dynamic import, keeping unused adapters out of each platform's bundle.

---

## Project Structure

```
src/
├── main/                   # Electron main process
│   ├── index.ts            # app lifecycle, window, tray, updater
│   ├── tray.ts             # system tray + context menu
│   ├── notifications.ts    # 10s reminder notification scheduler
│   ├── windowState.ts      # persist/restore window bounds
│   ├── updater.ts          # electron-updater wiring
│   ├── ipc/                # IPC handlers (reminders, notes, todos, window/dialog)
│   └── storage/            # better-sqlite3 repos + schema migrations
│
├── preload/
│   └── index.ts            # contextBridge API surface
│
└── renderer/src/           # React app (shared web + Electron)
    ├── platform/           # Storage adapter abstraction
    │   ├── types.ts        # IStorageAdapter interface
    │   ├── index.ts        # 3-way platform detection
    │   ├── electron.ts     # IPC adapter
    │   ├── web.ts          # IndexedDB adapter
    │   └── capacitor.ts    # stub (Phase 10)
    ├── components/
    │   ├── layout/         # AppShell, LeftSidebar, RightSidebar, SearchBar, BottomNav
    │   ├── calendar/       # MonthView, WeekView, CalendarDay, CalendarHeader
    │   ├── reminders/      # ReminderList, ReminderItem, ReminderForm, RecurrenceEditor
    │   ├── notes/          # NoteEditor (Milkdown)
    │   ├── todos/          # TodoList, TodoItem, TodoForm
    │   ├── settings/       # SettingsPage
    │   └── ui/             # Button, Dialog, Input, Badge, MarkdownView
    ├── hooks/
    │   ├── useKeyboardShortcuts.ts
    │   ├── useSearch.ts
    │   └── useNotifications.ts
    ├── store/              # Zustand stores (reminders, notes, todos, ui)
    ├── utils/              # recurrence helpers, date utils, exportImport
    └── types/models.ts     # Reminder, Note, Todo, RecurrenceRule
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development — web (browser, IndexedDB)
npm run dev:web

# Run in development — Electron (SQLite, HMR)
npm run dev

# Type checking
npm run typecheck

# Lint
npm run lint
```

### Building for distribution

```bash
npm run build:win     # Windows NSIS installer
npm run build:mac     # macOS DMG
npm run build:linux   # Linux AppImage / deb / snap
```

### Web build

```bash
npm run build:web     # outputs to dist/renderer/ — deploy to Vercel / Netlify
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search |
| `n` | New reminder (on day view) |
| `t` | New todo |
| `Esc` | Go back / close dialog |
| `Ctrl / ⌘ ,` | Open settings |

---

## Data & Export

All data is stored locally:

- **Electron** — SQLite database in the OS user-data directory (`app.getPath('userData')`)
- **Web** — IndexedDB in the browser

**Export:** Settings → Export saves `reminders-export-YYYY-MM-DD.json` containing all reminders, notes, and todos.

**Import:** Settings → Import restores from any previously exported file. Records are upserted — existing data is not deleted.

---

## Roadmap

- [x] Project scaffold, TypeScript config, Tailwind, ESLint
- [x] Data models and storage adapter interface
- [x] All three storage adapters (Electron IPC, Web IndexedDB, Capacitor stub)
- [x] Electron main process — SQLite schema + migrations, IPC handlers, contextBridge preload
- [x] Zustand stores (reminders, notes, todos, UI)
- [x] App shell — responsive 3-col layout, collapsible sidebars, bottom nav, dark mode
- [x] Calendar — month view, week view, day navigation, reminder indicator dots
- [x] Day view — Milkdown note editor with full GFM toolbar, reminder list + form with recurrence editor
- [x] Todos — drag-to-reorder, checkbox toggle, add/edit/delete, expandable Markdown descriptions
- [x] Left sidebar — upcoming reminders (next 30 days, rrule-expanded), click to navigate
- [x] Electron polish — system tray, native notifications, window state persistence, auto-updater
- [x] Search, keyboard shortcuts, export/import, settings page
- [ ] Tests — Vitest unit tests, Cypress e2e, GitHub Actions CI
- [ ] Mobile (Capacitor) — deferred until core app is stable

---

## License

MIT — see [LICENSE](./LICENSE)
