# Reminders

> **Status: In Development** — Core layout complete. Calendar, day view, todos, and reminders UI in progress.

A local-first reminders, notes, and calendar app. No accounts, no cloud sync, no subscription — your data stays on your device.

Runs as a native desktop app on Windows and macOS (Electron), a deployable web app (IndexedDB), and is scaffolded for future iOS/Android support (Capacitor).

---

## What It Does

- **Calendar** — Month and week views with reminder indicators. Click any day to open the day view.
- **Reminders** — Create one-off or recurring reminders (daily, weekly, monthly, yearly). Recurring reminders use RFC 5545 rrule — one record per series, never pre-expanded rows.
- **Notes** — A rich text note per day (bold, italic, lists, headings, links) powered by Tiptap/ProseMirror.
- **Todos** — A persistent todo list with drag-to-reorder. Float-gap ordering for O(1) updates.
- **Native notifications** — Desktop notifications fire at the reminder's scheduled time (Electron only).
- **Dark mode** — Toggle persisted across sessions.
- **Search** — Full-text search across reminders, notes, and todos. SQLite FTS5 on Electron; in-memory filter on web.
- **Export / Import** — Serialize all data to a portable JSON file and restore it later.
- **Keyboard shortcuts** — `n` new reminder, `t` new todo, `/` search, `←/→` navigate months, `Esc` close modal.

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
| Rich text | [Tiptap](https://tiptap.dev/) (ProseMirror-based) |
| Drag and drop | [@dnd-kit](https://dndkit.com/) |
| Recurrence | [rrule](https://github.com/jakubroztocil/rrule) — RFC 5545 compliant |
| Date utilities | [date-fns](https://date-fns.org/) v4 |
| Desktop storage | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — WAL mode, FTS5 search |
| Web storage | [idb](https://github.com/jakearchibald/idb) — typed IndexedDB wrapper |
| Mobile (future) | [Capacitor](https://capacitorjs.com/) — scaffold in place, full integration deferred |
| Icons | [Lucide React](https://lucide.dev/) |
| Packaging | [electron-builder](https://www.electron.build/) — Windows NSIS installer, macOS DMG |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |

---

## Architecture

The same React renderer codebase runs across all platforms. A **storage adapter abstraction** (`src/renderer/platform/`) handles the differences:

- **Electron** — IPC calls to the main process, which reads/writes SQLite via `better-sqlite3`
- **Web** — IndexedDB via `idb`
- **Capacitor** — Stubbed; will use `@capacitor-community/sqlite` with the same schema as Electron

Platform is detected at runtime (Electron → Capacitor → Web) and the correct adapter is loaded via dynamic import, keeping unused adapters out of each platform's bundle.

---

## Project Structure

```
src/
├── main/               # Electron main process (IPC handlers, SQLite, notifications, tray)
├── preload/            # contextBridge API surface
└── renderer/           # React app (shared across all platforms)
    ├── platform/       # Storage adapter abstraction
    ├── components/     # UI components
    ├── store/          # Zustand stores
    ├── hooks/          # useKeyboardShortcuts, useSearch
    ├── types/          # Data models
    └── utils/          # Recurrence, date, and ordering helpers
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development (Electron + HMR)
npm run dev

# Type checking
npm run typecheck

# Lint
npm run lint

# Tests
npm test
```

### Building for distribution

```bash
npm run build:win     # Windows NSIS installer
npm run build:mac     # macOS DMG
npm run build:linux   # Linux AppImage
```

### Web build

```bash
npm run build:web     # outputs to dist/renderer/ — deploy to Vercel/Netlify
```

---

## Roadmap

- [x] Project scaffold, TypeScript config, Tailwind, ESLint
- [x] Data models and storage adapter interface
- [x] All three storage adapters (Electron, Web, Capacitor stub)
- [x] Zustand stores
- [x] App shell — responsive 3-column layout, collapsible sidebars, bottom nav
- [ ] Calendar — month view, week view, day navigation
- [ ] Day view — note editor, reminder list, reminder form with recurrence
- [ ] Todos — drag-to-reorder list
- [ ] Left sidebar — upcoming reminders (next 30 days)
- [ ] Electron polish — tray, notifications, window state, auto-updater
- [ ] Search, keyboard shortcuts, export/import, settings
- [ ] Tests and packaging
- [ ] Mobile (Capacitor) — deferred until core app is stable

---

## License

MIT — see [LICENSE](./LICENSE)
