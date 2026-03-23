import { createClient, SupabaseClient, Session } from '@supabase/supabase-js'
import { getDb } from './storage/db'

type SyncStatus = 'idle' | 'syncing' | 'error'

export class SyncEngine {
  private status: SyncStatus = 'idle'
  private lastSyncedAt: string | null = null
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    )
  }

  getStatus() {
    return { status: this.status, lastSyncedAt: this.lastSyncedAt }
  }

  async sync(session: Session): Promise<void> {
    if (this.status === 'syncing') return
    this.status = 'syncing'

    try {
      await this.supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })

      const userId = session.user.id
      const db = getDb()

      const meta = db
        .prepare('SELECT last_pull_at FROM sync_meta WHERE user_id = ?')
        .get(userId) as { last_pull_at: string } | undefined
      const lastPullAt = meta?.last_pull_at ?? null

      await this.pull(userId, lastPullAt)
      await this.push(userId)

      const now = new Date().toISOString()
      db.prepare(
        'INSERT INTO sync_meta (user_id, last_pull_at) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET last_pull_at = ?'
      ).run(userId, now, now)

      this.lastSyncedAt = now
      this.status = 'idle'
    } catch (err) {
      console.error('[SyncEngine] sync error:', err)
      this.status = 'error'
    }
  }

  private async pull(userId: string, lastPullAt: string | null): Promise<void> {
    const db = getDb()

    // --- Reminders ---
    let remindersQuery = this.supabase.from('reminders').select('*').eq('user_id', userId)
    if (lastPullAt) remindersQuery = remindersQuery.gt('updated_at', lastPullAt)
    const { data: reminders, error: rErr } = await remindersQuery
    if (rErr) throw rErr

    for (const r of reminders ?? []) {
      const local = db.prepare('SELECT * FROM reminders WHERE id = ?').get(r.id) as any
      if (!local) {
        db.prepare(
          `INSERT OR IGNORE INTO reminders
            (id, title, description, date, time, recurrence, completed_dates, created_at, updated_at, deleted_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(r.id, r.title, r.description, r.date, r.time, r.recurrence, r.completed_dates,
              r.created_at, r.updated_at, r.deleted_at, r.updated_at)
      } else {
        const remoteTs = new Date(r.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()

        if (r.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE reminders SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE id = ?')
            .run(r.deleted_at, r.updated_at, r.updated_at, r.id)
        } else if (remoteTs >= localTs) {
          // Remote wins — union completedDates
          const localDates: string[] = JSON.parse(local.completed_dates ?? '[]')
          const remoteDates: string[] = JSON.parse(r.completed_dates ?? '[]')
          const merged = JSON.stringify([...new Set([...localDates, ...remoteDates])])
          db.prepare(
            `UPDATE reminders SET title = ?, description = ?, date = ?, time = ?, recurrence = ?,
              completed_dates = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE id = ?`
          ).run(r.title, r.description, r.date, r.time, r.recurrence,
                merged, r.updated_at, r.deleted_at, r.updated_at, r.id)
        } else {
          // Local is newer — still union completedDates
          const localDates: string[] = JSON.parse(local.completed_dates ?? '[]')
          const remoteDates: string[] = JSON.parse(r.completed_dates ?? '[]')
          const merged = [...new Set([...localDates, ...remoteDates])]
          if (merged.length !== localDates.length) {
            db.prepare('UPDATE reminders SET completed_dates = ? WHERE id = ?')
              .run(JSON.stringify(merged), r.id)
          }
        }
      }
    }

    // --- Notes ---
    let notesQuery = this.supabase.from('notes').select('*').eq('user_id', userId)
    if (lastPullAt) notesQuery = notesQuery.gt('updated_at', lastPullAt)
    const { data: notes, error: nErr } = await notesQuery
    if (nErr) throw nErr

    for (const n of notes ?? []) {
      const local = db.prepare('SELECT * FROM notes WHERE date = ?').get(n.date) as any
      if (!local) {
        db.prepare(
          'INSERT OR IGNORE INTO notes (date, content, updated_at, deleted_at, last_synced_at) VALUES (?, ?, ?, ?, ?)'
        ).run(n.date, n.content, n.updated_at, n.deleted_at, n.updated_at)
      } else {
        const remoteTs = new Date(n.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()
        if (n.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE notes SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE date = ?')
            .run(n.deleted_at, n.updated_at, n.updated_at, n.date)
        } else if (remoteTs >= localTs) {
          db.prepare(
            'UPDATE notes SET content = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE date = ?'
          ).run(n.content, n.updated_at, n.deleted_at, n.updated_at, n.date)
        }
      }
    }

    // --- Todos ---
    let todosQuery = this.supabase.from('todos').select('*').eq('user_id', userId)
    if (lastPullAt) todosQuery = todosQuery.gt('updated_at', lastPullAt)
    const { data: todos, error: tErr } = await todosQuery
    if (tErr) throw tErr

    for (const t of todos ?? []) {
      const local = db.prepare('SELECT * FROM todos WHERE id = ?').get(t.id) as any
      if (!local) {
        db.prepare(
          `INSERT OR IGNORE INTO todos
            (id, title, description, sort_order, completed, completed_at, created_at, updated_at, deleted_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(t.id, t.title, t.description, t.sort_order, t.completed, t.completed_at,
              t.created_at, t.updated_at, t.deleted_at, t.updated_at)
      } else {
        const remoteTs = new Date(t.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()
        if (t.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE todos SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE id = ?')
            .run(t.deleted_at, t.updated_at, t.updated_at, t.id)
        } else if (remoteTs >= localTs) {
          db.prepare(
            `UPDATE todos SET title = ?, description = ?, sort_order = ?, completed = ?,
              completed_at = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE id = ?`
          ).run(t.title, t.description, t.sort_order, t.completed, t.completed_at,
                t.updated_at, t.deleted_at, t.updated_at, t.id)
        }
      }
    }
  }

  private async push(userId: string): Promise<void> {
    const db = getDb()

    // Push any row not yet synced or changed since last sync
    const reminders = db
      .prepare('SELECT * FROM reminders WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const r of reminders) {
      const { error } = await this.supabase.from('reminders').upsert({
        id: r.id,
        user_id: userId,
        title: r.title,
        description: r.description,
        date: r.date,
        time: r.time,
        recurrence: r.recurrence,
        completed_dates: r.completed_dates,
        created_at: r.created_at,
        updated_at: r.updated_at,
        deleted_at: r.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE reminders SET last_synced_at = ? WHERE id = ?')
          .run(new Date().toISOString(), r.id)
      }
    }

    const notes = db
      .prepare('SELECT * FROM notes WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const n of notes) {
      const { error } = await this.supabase.from('notes').upsert({
        date: n.date,
        user_id: userId,
        content: n.content,
        updated_at: n.updated_at,
        deleted_at: n.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE notes SET last_synced_at = ? WHERE date = ?')
          .run(new Date().toISOString(), n.date)
      }
    }

    const todos = db
      .prepare('SELECT * FROM todos WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const t of todos) {
      const { error } = await this.supabase.from('todos').upsert({
        id: t.id,
        user_id: userId,
        title: t.title,
        description: t.description,
        sort_order: t.sort_order,
        completed: t.completed,
        completed_at: t.completed_at,
        created_at: t.created_at,
        updated_at: t.updated_at,
        deleted_at: t.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE todos SET last_synced_at = ? WHERE id = ?')
          .run(new Date().toISOString(), t.id)
      }
    }
  }
}

export const syncEngine = new SyncEngine()
