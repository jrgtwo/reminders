import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS reminders (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     date TEXT NOT NULL,
     time TEXT,
     recurrence TEXT,
     completed_dates TEXT NOT NULL DEFAULT '[]',
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date);

   CREATE TABLE IF NOT EXISTS notes (
     date TEXT PRIMARY KEY,
     content TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );

   CREATE TABLE IF NOT EXISTS todos (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     sort_order REAL NOT NULL DEFAULT 0,
     completed INTEGER NOT NULL DEFAULT 0,
     completed_at TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_todos_order ON todos(sort_order);

   CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
   INSERT OR IGNORE INTO schema_version VALUES (1);`,
  // MIGRATIONS[1]
  `ALTER TABLE reminders ADD COLUMN deleted_at TEXT;
  ALTER TABLE reminders ADD COLUMN last_synced_at TEXT;
  ALTER TABLE notes ADD COLUMN deleted_at TEXT;
  ALTER TABLE notes ADD COLUMN last_synced_at TEXT;
  ALTER TABLE todos ADD COLUMN deleted_at TEXT;
  ALTER TABLE todos ADD COLUMN last_synced_at TEXT;

  CREATE TABLE IF NOT EXISTS sync_meta (
    user_id TEXT PRIMARY KEY,
    last_pull_at TEXT
  );

  UPDATE schema_version SET version = 2;`,
  `ALTER TABLE todos ADD COLUMN due_date TEXT;`,
  // MIGRATIONS[3]
  `CREATE TABLE IF NOT EXISTS todo_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );
  CREATE TABLE IF NOT EXISTS todo_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    folder_id TEXT,
    sort_order REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    last_synced_at TEXT
  );
  ALTER TABLE todos ADD COLUMN list_id TEXT;`,
  // MIGRATIONS[4]
  `ALTER TABLE todo_lists ADD COLUMN due_date TEXT;
  CREATE TABLE IF NOT EXISTS todo_list_items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order REAL NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_todo_list_items_list ON todo_list_items(list_id, sort_order);`
]

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'reminders.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    runMigrations(db)
  }
  return db
}

function runMigrations(database: Database.Database) {
  const tableExists = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'")
    .get()
  const current = tableExists
    ? ((
        database.prepare('SELECT version FROM schema_version').get() as
          | { version: number }
          | undefined
      )?.version ?? 0)
    : 0

  for (let i = current; i < MIGRATIONS.length; i++) {
    database.transaction(() => {
      database.exec(MIGRATIONS[i])
    })()
  }
}
