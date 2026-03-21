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
    ? ((database.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined)?.version ?? 0)
    : 0

  for (let i = current; i < MIGRATIONS.length; i++) {
    database.transaction(() => {
      database.exec(MIGRATIONS[i])
    })()
  }
}