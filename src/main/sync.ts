import { createClient, SupabaseClient, Session } from '@supabase/supabase-js'
import { getDb } from './storage/db'

type SyncStatus = 'idle' | 'syncing' | 'error'

export interface SyncConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

export class SyncEngine {
  private status: SyncStatus = 'idle'
  private lastSyncedAt: string | null = null
  private client: SupabaseClient | null = null
  private clientUrl: string | null = null

  private getClient(config: SyncConfig): SupabaseClient {
    if (!this.client || this.clientUrl !== config.supabaseUrl) {
      this.clientUrl = config.supabaseUrl
      this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: false }
      })
    }
    return this.client
  }

  getStatus() {
    return { status: this.status, lastSyncedAt: this.lastSyncedAt }
  }

  async checkFirstLogin(
    userId: string,
    session: Session,
    config: SyncConfig
  ): Promise<{ isFirstLogin: boolean; hasLocal: boolean; hasRemote: boolean }> {
    const db = getDb()
    const meta = db.prepare('SELECT user_id FROM sync_meta WHERE user_id = ?').get(userId)
    if (meta) return { isFirstLogin: false, hasLocal: false, hasRemote: false }

    const localCount =
      (db.prepare('SELECT COUNT(*) as n FROM reminders WHERE deleted_at IS NULL').get() as any).n +
      (db.prepare('SELECT COUNT(*) as n FROM notes WHERE deleted_at IS NULL').get() as any).n +
      (db.prepare('SELECT COUNT(*) as n FROM todos WHERE deleted_at IS NULL').get() as any).n

    const sb = this.getClient(config)
    await sb.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })

    const [{ count: rc }, { count: nc }, { count: tc }] = await Promise.all([
      sb.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
      sb.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
      sb.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('deleted_at', null),
    ])
    const remoteCount = (rc ?? 0) + (nc ?? 0) + (tc ?? 0)

    return { isFirstLogin: true, hasLocal: localCount > 0, hasRemote: remoteCount > 0 }
  }

  markFirstLoginDone(userId: string): void {
    getDb()
      .prepare('INSERT INTO sync_meta (user_id, last_pull_at) VALUES (?, NULL) ON CONFLICT(user_id) DO NOTHING')
      .run(userId)
  }

  async sync(session: Session, config: SyncConfig): Promise<void> {
    if (this.status === 'syncing') return
    this.status = 'syncing'

    try {
      const sb = this.getClient(config)
      await sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })

      const userId = session.user.id
      const db = getDb()

      const meta = db
        .prepare('SELECT last_pull_at FROM sync_meta WHERE user_id = ?')
        .get(userId) as { last_pull_at: string } | undefined
      const lastPullAt = meta?.last_pull_at ?? null

      await this.pull(sb, userId, lastPullAt)
      await this.push(sb, userId)

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

  private async pull(sb: SupabaseClient, userId: string, lastPullAt: string | null): Promise<void> {
    const db = getDb()

    // --- Reminders ---
    let remindersQuery = sb.from('reminders').select('*').eq('user_id', userId)
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
    let notesQuery = sb.from('notes').select('*').eq('user_id', userId)
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
    let todosQuery = sb.from('todos').select('*').eq('user_id', userId)
    if (lastPullAt) todosQuery = todosQuery.gt('updated_at', lastPullAt)
    const { data: todos, error: tErr } = await todosQuery
    if (tErr) throw tErr

    for (const t of todos ?? []) {
      const local = db.prepare('SELECT * FROM todos WHERE id = ?').get(t.id) as any
      if (!local) {
        db.prepare(
          `INSERT OR IGNORE INTO todos
            (id, title, description, due_date, list_id, sort_order, completed, completed_at, created_at, updated_at, deleted_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(t.id, t.title, t.description, t.due_date, t.list_id, t.sort_order, t.completed, t.completed_at,
              t.created_at, t.updated_at, t.deleted_at, t.updated_at)
      } else {
        const remoteTs = new Date(t.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()
        if (t.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE todos SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE id = ?')
            .run(t.deleted_at, t.updated_at, t.updated_at, t.id)
        } else if (remoteTs >= localTs) {
          db.prepare(
            `UPDATE todos SET title = ?, description = ?, due_date = ?, list_id = ?, sort_order = ?, completed = ?,
              completed_at = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE id = ?`
          ).run(t.title, t.description, t.due_date, t.list_id, t.sort_order, t.completed, t.completed_at,
                t.updated_at, t.deleted_at, t.updated_at, t.id)
        }
      }
    }

    // --- Todo Folders ---
    let foldersQuery = sb.from('todo_folders').select('*').eq('user_id', userId)
    if (lastPullAt) foldersQuery = foldersQuery.gt('updated_at', lastPullAt)
    const { data: folders, error: fErr } = await foldersQuery
    if (fErr) throw fErr

    for (const f of folders ?? []) {
      const local = db.prepare('SELECT * FROM todo_folders WHERE id = ?').get(f.id) as any
      if (!local) {
        db.prepare(
          `INSERT OR IGNORE INTO todo_folders (id, name, sort_order, created_at, updated_at, deleted_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(f.id, f.name, f.sort_order, f.created_at, f.updated_at, f.deleted_at, f.updated_at)
      } else {
        const remoteTs = new Date(f.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()
        if (f.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE todo_folders SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE id = ?')
            .run(f.deleted_at, f.updated_at, f.updated_at, f.id)
        } else if (remoteTs >= localTs) {
          db.prepare(
            `UPDATE todo_folders SET name = ?, sort_order = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE id = ?`
          ).run(f.name, f.sort_order, f.updated_at, f.deleted_at, f.updated_at, f.id)
        }
      }
    }

    // --- Todo Lists ---
    let listsQuery = sb.from('todo_lists').select('*').eq('user_id', userId)
    if (lastPullAt) listsQuery = listsQuery.gt('updated_at', lastPullAt)
    const { data: lists, error: lErr } = await listsQuery
    if (lErr) throw lErr

    for (const l of lists ?? []) {
      const local = db.prepare('SELECT * FROM todo_lists WHERE id = ?').get(l.id) as any
      if (!local) {
        db.prepare(
          `INSERT OR IGNORE INTO todo_lists (id, name, folder_id, sort_order, created_at, updated_at, deleted_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(l.id, l.name, l.folder_id, l.sort_order, l.created_at, l.updated_at, l.deleted_at, l.updated_at)
      } else {
        const remoteTs = new Date(l.updated_at).getTime()
        const localTs = new Date(local.updated_at).getTime()
        if (l.deleted_at && !local.deleted_at) {
          db.prepare('UPDATE todo_lists SET deleted_at = ?, updated_at = ?, last_synced_at = ? WHERE id = ?')
            .run(l.deleted_at, l.updated_at, l.updated_at, l.id)
        } else if (remoteTs >= localTs) {
          db.prepare(
            `UPDATE todo_lists SET name = ?, folder_id = ?, sort_order = ?, updated_at = ?, deleted_at = ?, last_synced_at = ? WHERE id = ?`
          ).run(l.name, l.folder_id, l.sort_order, l.updated_at, l.deleted_at, l.updated_at, l.id)
        }
      }
    }
  }

  private async push(sb: SupabaseClient, userId: string): Promise<void> {
    const db = getDb()

    const reminders = db
      .prepare('SELECT * FROM reminders WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const r of reminders) {
      const { error } = await sb.from('reminders').upsert({
        id: r.id, user_id: userId, title: r.title, description: r.description,
        date: r.date, time: r.time, recurrence: r.recurrence,
        completed_dates: r.completed_dates, created_at: r.created_at,
        updated_at: r.updated_at, deleted_at: r.deleted_at
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
      const { error } = await sb.from('notes').upsert({
        date: n.date, user_id: userId, content: n.content,
        updated_at: n.updated_at, deleted_at: n.deleted_at
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
      const { error } = await sb.from('todos').upsert({
        id: t.id, user_id: userId, title: t.title, description: t.description,
        due_date: t.due_date ?? null, list_id: t.list_id ?? null,
        sort_order: t.sort_order, completed: t.completed,
        completed_at: t.completed_at, created_at: t.created_at, updated_at: t.updated_at,
        deleted_at: t.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE todos SET last_synced_at = ? WHERE id = ?')
          .run(new Date().toISOString(), t.id)
      }
    }

    const todoFolders = db
      .prepare('SELECT * FROM todo_folders WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const f of todoFolders) {
      const { error } = await sb.from('todo_folders').upsert({
        id: f.id, user_id: userId, name: f.name, sort_order: f.sort_order,
        created_at: f.created_at, updated_at: f.updated_at, deleted_at: f.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE todo_folders SET last_synced_at = ? WHERE id = ?')
          .run(new Date().toISOString(), f.id)
      }
    }

    const todoLists = db
      .prepare('SELECT * FROM todo_lists WHERE last_synced_at IS NULL OR updated_at > last_synced_at')
      .all() as any[]

    for (const l of todoLists) {
      const { error } = await sb.from('todo_lists').upsert({
        id: l.id, user_id: userId, name: l.name, folder_id: l.folder_id ?? null,
        sort_order: l.sort_order, created_at: l.created_at, updated_at: l.updated_at,
        deleted_at: l.deleted_at
      })
      if (!error) {
        db.prepare('UPDATE todo_lists SET last_synced_at = ? WHERE id = ?')
          .run(new Date().toISOString(), l.id)
      }
    }
  }
}

export const syncEngine = new SyncEngine()
