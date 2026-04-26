-- Add notify_before column to reminders.
-- Mirrors the existing SQLite column (db.ts migration 9) and the Reminder type's notifyBefore field.
-- Currently client-only state; once persisted, the upcoming background runner can compute correct fire times.

ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notify_before INTEGER;
