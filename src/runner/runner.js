/**
 * Background runner — runs in a separate JS context (JSCore on iOS, JS engine on
 * Android) when the OS wakes the app for periodic background tasks.
 *
 * Available globals: fetch, crypto.subtle, TextEncoder/Decoder, setTimeout,
 * console, CapacitorKV, CapacitorNotifications, CapacitorDevice, CapacitorApp.
 * NOT available: window, localStorage, IndexedDB, @capacitor/local-notifications,
 * @supabase/supabase-js.
 *
 * Pattern: addEventListener('event', (resolve, reject, args) => { ... }). MUST
 * call resolve()/reject() or the OS kills the process.
 */

import { reconcileSchedule, uuidToInt, tombstoneDate } from '../shared/reminderSchedule'

// ────────────────────────────────────────────────────────────────────────────
// CapacitorKV helpers
// ────────────────────────────────────────────────────────────────────────────

function kvGet(key) {
  try {
    const result = CapacitorKV.get(key)
    return result && result.value ? result.value : null
  } catch {
    return null
  }
}

function kvSet(key, value) {
  CapacitorKV.set(key, value)
}

function kvRemove(key) {
  CapacitorKV.remove(key)
}

// ────────────────────────────────────────────────────────────────────────────
// Base64 (the runner's JSCore context doesn't expose atob/btoa — those are
// Web APIs, not ECMAScript. Inline a minimal decoder — we only need decode.)
// ────────────────────────────────────────────────────────────────────────────

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_LOOKUP = new Uint8Array(128)
for (let i = 0; i < B64_CHARS.length; i++) B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i

function b64ToBytes(b64) {
  let len = b64.length
  let padding = 0
  if (len > 0 && b64[len - 1] === '=') padding++
  if (len > 1 && b64[len - 2] === '=') padding++
  const byteLen = (len * 3) / 4 - padding
  const bytes = new Uint8Array(byteLen)
  let p = 0
  for (let i = 0; i < len; i += 4) {
    const a = B64_LOOKUP[b64.charCodeAt(i)]
    const b = B64_LOOKUP[b64.charCodeAt(i + 1)]
    const c = B64_LOOKUP[b64.charCodeAt(i + 2)]
    const d = B64_LOOKUP[b64.charCodeAt(i + 3)]
    bytes[p++] = (a << 2) | (b >> 4)
    if (p < byteLen) bytes[p++] = ((b & 15) << 4) | (c >> 2)
    if (p < byteLen) bytes[p++] = ((c & 3) << 6) | d
  }
  return bytes
}

// ────────────────────────────────────────────────────────────────────────────
// AES-256-GCM decrypt (mirrors src/renderer/src/lib/encryption.ts)
// ────────────────────────────────────────────────────────────────────────────

const ENC_PREFIX = 'enc:'

async function importKey(b64) {
  const raw = b64ToBytes(b64)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
}

async function decrypt(key, text) {
  if (!text || typeof text !== 'string' || !text.startsWith(ENC_PREFIX)) return text
  const inner = text.slice(ENC_PREFIX.length)
  const dot = inner.indexOf('.')
  const iv = b64ToBytes(inner.slice(0, dot))
  const ciphertext = b64ToBytes(inner.slice(dot + 1))
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ────────────────────────────────────────────────────────────────────────────
// Token refresh
// ────────────────────────────────────────────────────────────────────────────

async function getValidAccessToken() {
  const expiresAt = parseInt(kvGet('expires_at') || '0', 10)
  const accessToken = kvGet('access_token')
  const refreshToken = kvGet('refresh_token')
  const supabaseUrl = kvGet('supabase_url')
  const anonKey = kvGet('supabase_anon_key')

  if (!refreshToken || !supabaseUrl || !anonKey) return null

  // Refresh if missing, expired, or expires in <60s
  const nowSec = Math.floor(Date.now() / 1000)
  if (accessToken && expiresAt > nowSec + 60) return accessToken

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  kvSet('access_token', data.access_token)
  kvSet('refresh_token', data.refresh_token)
  kvSet('expires_at', String(data.expires_at))
  return data.access_token
}

// ────────────────────────────────────────────────────────────────────────────
// Supabase REST
// ────────────────────────────────────────────────────────────────────────────

async function fetchReminders(accessToken, supabaseUrl, anonKey, userId) {
  // Pull all reminders the user owns (active + recently soft-deleted, so we
  // can tombstone the latter). 30-day deleted-at window keeps the response
  // bounded; older deletions are already cleaned up by the renderer.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const url =
    `${supabaseUrl}/rest/v1/reminders?` +
    `user_id=eq.${userId}&` +
    `or=(deleted_at.is.null,deleted_at.gte.${encodeURIComponent(cutoff)})&` +
    `select=*`
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Fetch reminders failed: ${res.status}`)
  return res.json()
}

async function rowToReminder(row, key) {
  return {
    id: row.id,
    title: row.title ? await decrypt(key, row.title) : '',
    description: row.description ? await decrypt(key, row.description) : undefined,
    date: row.date,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    notifyBefore: row.notify_before == null ? undefined : row.notify_before,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
    completedDates: row.completed_dates ? JSON.parse(row.completed_dates) : [],
    deletedAt: row.deleted_at || null,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Event handlers
// ────────────────────────────────────────────────────────────────────────────

addEventListener('setCredentials', (resolve, reject, args) => {
  try {
    if (args.user_id) kvSet('user_id', args.user_id)
    if (args.enc_key) kvSet('enc_key', args.enc_key)
    if (args.access_token) kvSet('access_token', args.access_token)
    if (args.refresh_token) kvSet('refresh_token', args.refresh_token)
    if (args.expires_at !== undefined) kvSet('expires_at', String(args.expires_at))
    if (args.supabase_url) kvSet('supabase_url', args.supabase_url)
    if (args.supabase_anon_key) kvSet('supabase_anon_key', args.supabase_anon_key)
    resolve()
  } catch (err) {
    reject(err)
  }
})

addEventListener('clearCredentials', (resolve) => {
  ;[
    'user_id',
    'enc_key',
    'access_token',
    'refresh_token',
    'expires_at',
    'supabase_url',
    'supabase_anon_key',
  ].forEach(kvRemove)
  resolve()
})

addEventListener('sync', async (resolve, reject) => {
  try {
    const userId = kvGet('user_id')
    const encKeyB64 = kvGet('enc_key')
    const supabaseUrl = kvGet('supabase_url')
    const anonKey = kvGet('supabase_anon_key')

    if (!userId || !encKeyB64 || !supabaseUrl || !anonKey) {
      resolve()
      return
    }

    const accessToken = await getValidAccessToken()
    if (!accessToken) throw new Error('No access token available')

    const rows = await fetchReminders(accessToken, supabaseUrl, anonKey, userId)
    const key = await importKey(encKeyB64)
    const reminders = await Promise.all(rows.map((row) => rowToReminder(row, key)))

    const now = new Date()

    const tombstones = reminders
      .filter((r) => r.deletedAt)
      .map((r) => ({
        id: uuidToInt(r.id),
        title: '',
        body: '',
        scheduleAt: tombstoneDate(),
      }))

    const active = reminders.filter((r) => !r.deletedAt)
    const { toSchedule } = reconcileSchedule(active, [], now)

    const notifications = [
      ...tombstones,
      ...toSchedule.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
        scheduleAt: s.fireAt,
        actionTypeId: 'REMINDER_ACTIONS',
      })),
    ]

    if (notifications.length > 0) {
      CapacitorNotifications.schedule(notifications)
    }

    resolve()
  } catch (err) {
    reject(err)
  }
})
