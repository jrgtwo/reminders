# Encryption Plan: Field-level AES-256-GCM with Key in Supabase

## Context
All user text (reminder titles/descriptions, todo titles, note content, folder/list names) is stored as plaintext in the local SQLite DB and in Supabase. The goal is transparent encryption that still supports cross-device sync and data export.

## Chosen approach
- **Algorithm**: AES-256-GCM via the native Web Crypto API (no new deps, works in Electron renderer, web browser, and Capacitor)
- **Key management**: One random 256-bit key per user, stored in a `user_keys` table in Supabase (protected by RLS + auth). Fetched after login, held in memory only. Cached locally for offline use (safeStorage on Electron, localStorage on web).
- **Sync**: Ciphertext is synced to Supabase as-is. `src/main/sync.ts` and `src/renderer/src/lib/webSync.ts` are untouched — they just move blobs around.
- **Migration**: Sentinel prefix `enc:iv.ciphertext` (base64). Legacy plaintext (no prefix) passes through on read and gets encrypted on next write — no explicit migration step needed.

## Encrypted fields
- `Reminder.title`, `Reminder.description`
- `Todo.title`, `Todo.description`
- `Note.content` (encrypt the JSON string)
- `TodoFolder.name`, `TodoList.name`

**Not encrypted**: dates, times, IDs, recurrence rules, sort_order, completed, timestamps (needed for queries/sorting/sync).

## Architecture: EncryptedAdapter decorator
Encryption lives in a wrapper around the platform adapter (renderer side). The Electron main process and sync code see only ciphertext and need zero changes.

```
Zustand store
    ↓
EncryptedAdapter  ← encrypt on write, decrypt on read
    ↓
ElectronAdapter / WebAdapter  (unchanged)
    ↓
SQLite / IndexedDB / Supabase  (stores ciphertext)
```

## Files to create

### 1. `src/renderer/src/lib/encryption.ts` — Web Crypto utils
- `generateKey(): Promise<CryptoKey>`
- `exportKey(key): Promise<string>` — base64 raw bytes
- `importKey(b64): Promise<CryptoKey>`
- `encrypt(key, plaintext): Promise<string>` — returns `enc:iv.ciphertext` (both base64)
- `decrypt(key, text): Promise<string>` — if no `enc:` prefix, returns text as-is (legacy passthrough)

### 2. `src/renderer/src/lib/keyManager.ts` — Key lifecycle
- `initEncryptionKey(supabase, userId)`: fetch from `user_keys`; if absent, generate + insert; return CryptoKey
- `cacheKeyLocally(b64)` / `loadCachedKey()`: safeStorage on Electron, localStorage on web
- `clearCachedKey()`

### 3. `src/renderer/src/platform/encryptedAdapter.ts` — Decorator
- `class EncryptedAdapter implements IStorageAdapter`
- Constructor: `(inner: IStorageAdapter, getKey: () => CryptoKey | null)`
- Each save method encrypts relevant fields; each get method decrypts
- If key is null, passes through unmodified (graceful degradation)

## Files to modify

4. **Adapter instantiation** (wherever ElectronAdapter/WebAdapter is created) — wrap with `EncryptedAdapter`

5. **`src/renderer/src/store/auth.store.ts`** — after login: call `initEncryptionKey`, store CryptoKey. On logout: clear key + `clearCachedKey()`.

6. **`src/preload/index.ts`** + **`src/main/ipc/`** — add 2 IPC handlers for `safeStorage.encryptString` / `decryptString` (Electron key caching only)

## Supabase setup (manual — run in SQL editor)
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
- **Web**: store base64 key in `localStorage` under `enc_key_${userId}`. Can be upgraded later.

## Future: Privacy mode for OS notifications
Desktop notifications show the reminder title in plaintext in the OS notification centre, visible to screen recording tools and accessibility services. Add a "Privacy mode" toggle in Settings that, when enabled, replaces the notification body with a generic "You have a reminder" instead of the actual title. Applies to Electron (`src/main/notifications.ts`) and any future Capacitor push notifications.

## Verification steps
1. Build, log in, create a reminder
2. Open SQLite in DB Browser — `title` column should be `enc:...` base64
3. Check Supabase dashboard — synced record title should be ciphertext
4. Log out, log back in — data decrypts and displays correctly
5. Second device / browser tab with same account — data is readable
6. Go offline — data still readable via cached key
