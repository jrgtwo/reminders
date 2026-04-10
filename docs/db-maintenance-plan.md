# Database Maintenance Plan

Addresses PostgreSQL bloat risk from soft deletes, frequent syncs, and unbounded `completed_dates` growth as users scale.

---

## Step 1 — Enable pg_cron in Supabase Dashboard

1. Go to **Database → Extensions** in the Supabase Dashboard
2. Search for `pg_cron` and enable it
3. Also enable `pg_trgm` if you plan to add text search indexes later

---

## Step 2 — Create the migration file

Create `supabase/migrations/20260409000000_db_maintenance.sql` with the following content:

```sql
-- ============================================================
-- 1. AUTOVACUUM TUNING
-- High-churn tables (frequent updated_at / last_synced_at writes)
-- Default scale_factor is 0.2 (20% dead tuples before vacuum).
-- Lower it to 1% so vacuum runs more aggressively on these tables.
-- ============================================================
ALTER TABLE notes           SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE todos            SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE todo_list_items  SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE reminders        SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.01);


-- ============================================================
-- 2. PARTIAL INDEXES ON deleted_at
-- Speeds up the common query pattern: WHERE deleted_at IS NULL
-- Also makes the nightly purge jobs faster.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notes_deleted           ON notes(deleted_at)          WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_deleted           ON todos(deleted_at)           WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todo_lists_deleted      ON todo_lists(deleted_at)      WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todo_folders_deleted    ON todo_folders(deleted_at)    WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todo_list_items_deleted ON todo_list_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_deleted       ON reminders(deleted_at)       WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_folders_deleted    ON note_folders(deleted_at)    WHERE deleted_at IS NOT NULL;


-- ============================================================
-- 3. PURGE JOBS via pg_cron
-- Hard-delete soft-deleted rows after 30-day retention window.
-- Runs nightly at 03:00 UTC.
-- ============================================================

-- Remove any existing jobs with these names first (idempotent)
SELECT cron.unschedule('purge-deleted-notes')          WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-notes');
SELECT cron.unschedule('purge-deleted-todos')          WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-todos');
SELECT cron.unschedule('purge-deleted-todo-lists')     WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-todo-lists');
SELECT cron.unschedule('purge-deleted-todo-folders')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-todo-folders');
SELECT cron.unschedule('purge-deleted-list-items')     WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-list-items');
SELECT cron.unschedule('purge-deleted-reminders')      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-reminders');
SELECT cron.unschedule('purge-deleted-note-folders')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-note-folders');

SELECT cron.schedule('purge-deleted-notes',        '0 3 * * *', $$DELETE FROM notes           WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-todos',        '0 3 * * *', $$DELETE FROM todos            WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-todo-lists',   '0 3 * * *', $$DELETE FROM todo_lists       WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-todo-folders', '0 3 * * *', $$DELETE FROM todo_folders     WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-list-items',   '0 3 * * *', $$DELETE FROM todo_list_items  WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-reminders',    '0 3 * * *', $$DELETE FROM reminders        WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
SELECT cron.schedule('purge-deleted-note-folders', '0 3 * * *', $$DELETE FROM note_folders     WHERE deleted_at < NOW() - INTERVAL '30 days'$$);
```

---

## Step 3 — Apply the migration

```bash
supabase db push
```

Or paste it directly into **Database → SQL Editor** in the Dashboard if you prefer not to use the CLI.

---

## Step 4 — Verify cron jobs registered

In the Supabase Dashboard SQL Editor, run:

```sql
SELECT jobid, jobname, schedule, command, active FROM cron.job;
```

You should see all 7 jobs listed.

---

## Step 5 — App-side: cap `completed_dates` on write

This can't be done in SQL alone since the trimming logic depends on the recurrence rule. In your app code, wherever you write to `completed_dates`, trim entries older than 90 days before saving:

```ts
// Wherever you update completed_dates for a reminder
function trimCompletedDates(dates: string[], cutoffDays = 90): string[] {
  const cutoff = Temporal.Now.plainDateISO().subtract({ days: cutoffDays });
  return dates.filter(d => Temporal.PlainDate.compare(Temporal.PlainDate.from(d), cutoff) >= 0);
}
```

Apply this trim before every write so the column never grows beyond ~90 entries per reminder.

---

## Summary

| Problem | Fix | Effect |
|---|---|---|
| Soft-deleted row accumulation | pg_cron nightly purge (30-day retention) | Rows physically removed, tables stay lean |
| Dead tuple bloat from syncs | Autovacuum tuning (1% threshold) | Vacuum runs more frequently on hot tables |
| Slow queries on `deleted_at` filter | Partial indexes | Faster reads + faster purge deletes |
| `completed_dates` unbounded growth | App-side 90-day trim on write | Column stays bounded per row |
