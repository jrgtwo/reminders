# Encryption: Field-level AES-256-GCM with Key in Supabase

> **Status: Fully implemented.** All items below are complete.

## Context
All user text (reminder titles/descriptions, todo titles, note content, folder/list names) is encrypted before leaving the device. The encryption is transparent: stores read/write plain objects; only ciphertext reaches IndexedDB, SQLite, and Supabase.

## Approach
- **Algorithm**: AES-256-GCM via the native Web Crypto API — no extra dependencies; works in Electron renderer, web browser, and Capacitor
- **Key management**: One random 256-bit key per user, stored in a `user_keys` table in Supabase (protected by RLS + auth). Fetched after login, held in memory only. Cached locally for offline use (`safeStorage` on Electron, `localStorage` on web).
- **Sync**: Ciphertext is synced to Supabase as-is. `src/main/sync.ts` and `src/renderer/src/lib/webSync.ts` are untouched — they just move blobs around.
- **Migration**: Sentinel prefix `enc:iv.ciphertext` (base64). Legacy plaintext (no prefix) passes through on read and gets re-encrypted on next write — no explicit migration step needed.

## Encrypted fields
- `Reminder.title`, `Reminder.description`
- `Todo.title`, `Todo.description`
- `Note.content` (encrypt the JSON string)
- `TodoFolder.name`, `TodoList.name`

**Not encrypted**: dates, times, IDs, recurrence rules, sort_order, completed, timestamps (needed for queries/sorting/sync).

## Architecture: EncryptedAdapter decorator

```
Zustand store
    ↓
EncryptedAdapter  ← encrypt on write, decrypt on read
    ↓
ElectronAdapter / WebAdapter  (unchanged)
    ↓
SQLite / IndexedDB / Supabase  (stores ciphertext)
```

## Implemented files

### `src/renderer/src/lib/encryption.ts` — Web Crypto utils
- `generateKey(): Promise<CryptoKey>`
- `exportKey(key): Promise<string>` — base64 raw bytes
- `importKey(b64): Promise<CryptoKey>`
- `encrypt(key, plaintext): Promise<string>` — returns `enc:iv.ciphertext` (both base64)
- `decrypt(key, text): Promise<string>` — if no `enc:` prefix, returns text as-is (legacy passthrough)

### `src/renderer/src/lib/keyManager.ts` — Key lifecycle
- `initEncryptionKey(userId)`: fetch from `user_keys`; if absent, generate + insert; cache locally; return `CryptoKey`
- `cacheKeyLocally(b64)` / `loadCachedKey()`: `safeStorage` IPC on Electron, `localStorage` on web
- `clearCachedKey()`
- Detects key fingerprint changes across devices — if the Supabase key differs from the cached local key, clears local data and re-pulls from cloud

### `src/renderer/src/lib/keyRotation.ts` — Key rotation
- `rotateKey(userId)`: generates a new key, re-encrypts all local records, pushes new key + updated ciphertext to Supabase
- Exposed via Settings page under Account section

### `src/renderer/src/platform/encryptedAdapter.ts` — Decorator
- `class EncryptedAdapter implements IStorageAdapter`
- Constructor: `(inner: IStorageAdapter, getKey: () => CryptoKey | null)`
- Each save method encrypts relevant fields; each get method decrypts
- If key is null, passes through unmodified (graceful degradation)

### `src/renderer/src/store/auth.store.ts` — Auth integration
- After login: calls `initEncryptionKey(userId)`, stores `CryptoKey` in module-level variable used by `EncryptedAdapter`
- On logout: clears in-memory key + calls `clearCachedKey()`
- `onAuthStateChange` callback is **synchronous** — async work is deferred via `setTimeout(0)` to escape the Supabase `navigator.locks` auth lock (see below)

### `src/preload/index.ts` + `src/main/ipc/` — Electron key caching
- IPC handlers for `safeStorage.encryptString` / `decryptString` added
- Preload exposes `window.electronAPI.safeStorage.*`

## Supabase setup
```sql
CREATE TABLE user_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  key_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own key" ON user_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## Offline key caching
- **Electron**: IPC bridge to `safeStorage.encryptString/decryptString`. Cache encrypted key bytes in `{userData}/enc_key`. On launch: try cache first, fall back to Supabase.
- **Web**: store base64 key in `localStorage` under `enc_key_${userId}`. Can be upgraded to a more secure store later.

## Known implementation detail: Supabase auth lock contention

**Problem**: `supabase-js` v2.99.3 uses `navigator.locks.request` with a 5-second timeout when managing the auth token. When a session is restored on load, `_recoverAndRefresh` fires `SIGNED_IN` inside the lock. If our `onAuthStateChange` callback makes network requests (e.g. `initEncryptionKey` calling Supabase), those requests also try to acquire the lock — causing "Lock was released because another request stole it" errors.

**Note on `skipAutoInitialize`**: The option `skipAutoInitialize: true` in `createClient` is silently ignored in v2.99.3 — `_initSupabaseAuthClient` does not include it in its destructured parameters, so `GoTrueClient` always calls `initialize()` from the constructor regardless.

**Fix**: `onAuthStateChange` callback is synchronous. All async work (key init, store updates) is deferred with `setTimeout(0)`, which schedules the work as a macrotask *after* the lock is released:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') return
  setTimeout(async () => {
    if (session?.user) {
      await initEncryptionKey(session.user.id).catch(console.error)
    }
    set({ session, user: session?.user ?? null, isLoggedIn: !!session })
  }, 0)
})
```

## Privacy mode (future)
Desktop notifications show the reminder title in plaintext in the OS notification centre, visible to screen recording tools and accessibility services. Add a "Privacy mode" toggle in Settings that, when enabled, replaces the notification body with a generic "You have a reminder" instead of the actual title. Applies to Electron (`src/main/notifications.ts`) and any future Capacitor push notifications.

## Verification
1. Build, log in, create a reminder
2. Open IndexedDB in DevTools (web) or SQLite in DB Browser (Electron) — `title` field should be `enc:...` base64
3. Check Supabase dashboard — synced record title should be ciphertext
4. Log out, log back in — data decrypts and displays correctly
5. Second device / browser tab with same account — data is readable after key fetch
6. Go offline — data still readable via cached key
