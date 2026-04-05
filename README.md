# Reminder Today

A calm, focused productivity app for people who want their calendar, reminders, notes, and todos in one place — without the bloat.

Available at [remindertoday.com](https://remindertoday.com). Also runs as a native desktop app on Windows and macOS.

---

## What it does

### Calendar
Switch between month and week views. Days with reminders show colored indicators — red for overdue, amber for today, indigo for upcoming. Click any day to open it and see your reminders and notes for that date. A "Today" button always brings you back to the current date.

### Reminders
Create reminders for any date, with an optional time. Reminders can repeat — daily, weekly, monthly, or yearly — and each occurrence can be checked off independently. A **Schedule** sidebar on the left keeps your overdue and upcoming reminders (next 30 days) always in view, grouped by recency. Click any reminder in the sidebar to jump straight to that day.

### Daily Notes
Every day has its own note. Write freely using Markdown — headings, lists, bold, tables, code blocks, links, and more. Notes autosave as you type.

### Todos
A persistent todo list that lives in the right sidebar. Drag items to reorder them. Todos can be:
- **Anytime** — no date, just things to get done
- **Dated** — assign a due date and they appear under Overdue or Upcoming
- **In a list** — organized into named lists (see below)

### Todo Lists
Create named lists to organize related todos — shopping, work projects, personal goals, anything. Lists can optionally be grouped into folders. The right sidebar shows all your lists alongside your other todos, and clicking a list opens its full view.

### Sync across devices
Sign in with your email (no password — just a magic link). Once signed in, everything syncs automatically across all your devices. The app works fully offline and syncs whenever you're connected. Your data is always saved locally first.

All synced data is **end-to-end encrypted** with AES-256-GCM before it leaves your device. Your encryption key is stored in your account and never accessible to anyone else.

### Everything else
- **9 themes** — Light, Dark, Dim, Warm, Midnight, Nord, Forest, Dusk, Grey
- **Search** — find any reminder or todo instantly
- **Export / Import** — back up everything to a JSON file, restore it any time
- **Keyboard shortcuts** — navigate without touching the mouse

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Search |
| `n` | New reminder (on day view) |
| `t` | New todo |
| `Esc` | Close dialog / go back |
| `Ctrl / ⌘ ,` | Settings |

---

## Your data

Everything is stored locally on your device first. Signing in enables optional cloud sync — your local data is never deleted and the app works fully offline.

All synced data is encrypted client-side with AES-256-GCM. The encryption key is generated on your first login, stored in your Supabase account (protected by row-level security), and cached locally for offline use. Supabase and anyone with database access see only ciphertext.

**Export:** Settings → Data → Export — saves a full backup of all your reminders, notes, and todos.

**Import:** Settings → Data → Import — restores from any previous backup without overwriting unrelated data.

**Reset from cloud:** Settings → Data → Reset from cloud — wipes local data and pulls a clean copy from the cloud. Use this if local data gets out of sync. This is a pull-only operation: nothing is pushed back, so records deleted from the cloud stay deleted.

**Clear local data:** Settings → Data → Clear local data — wipes all data from this device without touching the cloud. The next sync will repopulate from the cloud.

---

## Running locally

```bash
npm install

# Web (browser)
npm run dev:web

# Desktop (Electron)
npm run dev
```

Requires a `.env` file with your Supabase project URL and anon key — copy `.env.example` to get started.

---

## License

MIT — see [LICENSE](./LICENSE)
