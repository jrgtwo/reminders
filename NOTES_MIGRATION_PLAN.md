# Notes Migration Plan: Multi-Note Per Day with Folder Structure

## Overview

**Current State:** Notes are stored as one-per-day keyed by date (YYYY-MM-DD), enforced as PRIMARY KEY across all storage layers (SQLite, IndexedDB, Supabase).

**Target State:** Migrate notes to follow the todo list folder structure pattern:

- **Date-based notes**: Multiple notes per day, organized by date (like date-based todo lists)
- **Ad-hoc notes**: Multiple notes in folders without date association (like ad-hoc todo lists)
- Support for **NoteFolders** to organize ad-hoc notes
- Enable multiple notes per day with unique IDs

**Implementation Approach:** Fresh implementation without migration scripts (no existing users/data). Database will be cleared and new schema implemented directly.

---

## Data Model Changes

### 1. New Type Definitions (`src/renderer/src/types/models.ts`)

```typescript
// Replace current Note interface
export interface Note {
  id: string // NEW: Unique identifier (UUID)
  title?: string // OPTIONAL: User-provided or auto-generated
  content: string // Markdown content (unchanged)
  folderId?: string // AD-HOC: Folder ID for ad-hoc notes
  date?: string // DATE-BASED: YYYY-MM-DD for date-based notes
  order: number // NEW: Display order within folder/date
  createdAt: string // ISO timestamp (unchanged)
  updatedAt: string // ISO timestamp (unchanged)
}

// NEW: NoteFolder interface (similar to TodoFolder)
export interface NoteFolder {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}
```

**Key Changes:**

- `id` becomes PRIMARY KEY (replaces `date`)
- `title` field is OPTIONAL (auto-generated if not provided)
- `folderId` and `date` are mutually exclusive (like todo lists)
- Multiple notes can now share the same `date`

**Title Auto-Generation:**

If user doesn't provide a title when creating a note:

- Generate `Untitled-(mm-dd-yy hh:mm:ss)` format
- Example: `Untitled-(04-05-26 15:30:45)`
- Auto-generated titles are editable by user
- Generation happens at note creation time (`createdAt`)

---

### 2. Database Schema Migrations

#### SQLite (`src/main/storage/db.ts`)

**New Schema (Fresh Implementation):**

```sql
CREATE TABLE IF NOT EXISTS note_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT,                  -- OPTIONAL (auto-generated if null)
  content TEXT NOT NULL,
  folder_id TEXT,              -- AD-HOC notes
  due_date TEXT,               -- DATE-BASED notes (YYYY-MM-DD)
  order REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  last_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id, order);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(due_date, order);
CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted_at);
```

**Implementation Steps:**

1. Clear existing notes table (DROP TABLE IF EXISTS)
2. Create `note_folders` table
3. Create new `notes` table with new schema
4. No data migration needed (fresh database)

#### IndexedDB (`src/renderer/src/platform/web.ts`)

**Current:**

```typescript
db.createObjectStore('notes', { keyPath: 'date' })
```

**New:**

```typescript
db.createObjectStore('notes', { keyPath: 'id' })
db.createObjectStore('note_folders', { keyPath: 'id' })
```

#### Supabase (`src/main/sync.ts`, `src/renderer/src/lib/webSync.ts`)

**New Tables (Fresh Implementation):**

```sql
CREATE TABLE note_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Notes table (create fresh, no ALTER needed)
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,                  -- OPTIONAL (auto-generated if null)
  content TEXT NOT NULL,
  folder_id TEXT REFERENCES note_folders(id),
  due_date TEXT,
  order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_notes_user_folder ON notes(user_id, folder_id, order);
CREATE INDEX idx_notes_user_date ON notes(user_id, due_date, order);
CREATE INDEX idx_notes_user_deleted ON notes(user_id, deleted_at);
```

---

### 3. Storage Adapter Updates

#### Backend (`src/main/storage/notes.repo.ts`)

**Remove:**

- `getNoteByDate(date: string)` - No longer meaningful

**Update:**

- `getAllNotes()` - Return all non-deleted notes, filter client-side for date grouping
- `saveNote(n)` - Use `id` as primary key

**New:**

- `getNotesByFolder(folderId: string)` - Get ad-hoc notes in folder
- `getNotesByDate(date: string)` - Get all notes for a specific date (returns array)
- `getAllNoteFolders()` - Return all folders
- `saveNoteFolder(f)` - Save folder
- `deleteNoteFolder(id)` - Soft delete folder

#### Frontend Platform Interface (`src/renderer/src/platform/types.ts`)

**Add methods:**

```typescript
// Note Folders
getAllNoteFolders(): Promise<NoteFolder[]>
saveNoteFolder(f: NoteFolder): Promise<NoteFolder>
deleteNoteFolder(id: string): Promise<void>

// Notes (updated)
getNotesByFolder(folderId: string): Promise<Note[]>
getNotesByDate(date: string): Promise<Note[]>
```

#### Electron Storage Adapter (`src/renderer/src/platform/electron.ts`)

Update IPC handlers to call new backend methods.

#### Web Storage Adapter (`src/renderer/src/platform/web.ts`)

Update IndexedDB operations to use `id` as key path.

---

### 4. State Management (Zustand)

#### New Store: `note_folders.store.ts`

```typescript
interface NoteFoldersState {
  folders: NoteFolder[]
  load: () => Promise<void>
  save: (f: NoteFolder) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNoteFoldersStore = create<NoteFoldersState>()(...)
```

#### Updated Store: `notes.store.ts`

**Current:**

```typescript
interface NotesState {
  notes: Record<string, Note>  // Keyed by date
  noteDates: string[]
  ...
}
```

**New:**

```typescript
interface NotesState {
  notes: Map<string, Note> // Keyed by id
  folders: NoteFolder[] // Fetched from store
  loadNotes: () => Promise<void>
  saveNote: (n: Note) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  // New actions for folder-based views
  loadNotesByFolder: (folderId: string) => Promise<void>
  loadNotesByDate: (date: string) => Promise<void>
}
```

---

### 5. UI Components

#### A. NoteEditor (`src/renderer/src/components/notes/NoteEditor.tsx`)

**Changes:**

- Accept `note: Note` instead of `date: string`
- Show title field in editor header (optional, editable)
- If title is empty, show placeholder or auto-generated format
- Auto-save still works on content changes
- Handle note deletion

**Before:**

```typescript
interface Props {
  date: string
}
```

**After:**

```typescript
interface Props {
  note: Note
  onDelete?: (id: string) => void
}
```

**Title Input Behavior:**

- Title input is optional
- If note has no title, input shows empty
- User can type custom title or leave blank
- Auto-generated titles (Untitled-\*) can be edited or cleared

#### B. NoteList Component (NEW)

Create a component to display multiple notes:

- **For date view**: Show all notes for a specific date
- **For folder view**: Show all notes in a folder
- Support: Create new note, edit title, delete, reorder

**Props:**

```typescript
interface NoteListProps {
  notes: Note[]
  folder?: NoteFolder
  date?: string
  onNew: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onReorder?: (orderedIds: string[]) => void
}
```

#### C. NoteFolderForm (`src/renderer/src/components/notes/NoteFolderForm.tsx`)

Similar to `FolderForm.tsx` but for notes:

- Create/edit note folders
- Rename folders
- Delete folders (with confirmation)

#### D. DayView Updates (`src/renderer/src/components/DayView.tsx`)

**Current Notes Tab:**

- Shows single `NoteEditor` for the date

**New Notes Tab:**

- Show `NoteList` with all notes for the date
- Add "New note" button
- Each note shows title + preview
- Click to open in full-screen editor or inline

**URL Changes:**

- `/day/:date` - List all notes for date (no full editor)
- `/notes/:id` - Full-screen editor for single note

#### E. Calendar View Updates

**MonthView:**

- Show note count indicator (e.g., "📄 3") instead of just presence

**CalendarDay:**

- Display number of notes if > 0

#### F. Search Updates (`src/renderer/src/hooks/useSearch.ts`)

**Current:**

```typescript
notes: Object.values(notes).filter((n) => n.content.toLowerCase().includes(q))
```

**New:**

```typescript
notes: Array.from(notes.values()).filter(
  (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
)
```

Search results should show:

- Title
- Date (if date-based) or Folder name (if ad-hoc)
- Excerpt from content

---

## Migration Phases

### Phase 1: Schema & Storage Layer

1. **Database migrations** (`src/main/storage/db.ts`)
   - Add note_folders table
   - Create new notes table structure (title is optional)
   - Clear existing notes table (fresh implementation)

2. **Backend storage** (`src/main/storage/notes.repo.ts`)
   - Implement new queries
   - Remove date-based primary key logic

3. **IPC handlers** (`src/main/ipc/notes.ts`)
   - Add new handlers for folder operations
   - Update note operations
   - Add title auto-generation logic when title is null

4. **Frontend storage interface** (`src/renderer/src/platform/types.ts`)
   - Add new methods

5. **Platform adapters**
   - Electron (`src/renderer/src/platform/electron.ts`)
   - Web (`src/renderer/src/platform/web.ts`)

6. **Utility functions** (`src/renderer/src/utils/noteUtils.ts`)
   - Create `generateTitle()` function
   - Format: `Untitled-(mm-dd-yy hh:mm:ss)`
   - Helper for consistent title generation

---

### Phase 2: State Management

1. **Create note_folders.store.ts**
2. **Refactor notes.store.ts**
   - Change from `Record<string, Note>` to `Map<string, Note>`
   - Add folder-based loading methods
3. **Update all stores that import notes**

---

### Phase 3: UI Components

1. **Create NoteFolderForm.tsx**
2. **Create NoteList.tsx**
3. **Update NoteEditor.tsx**
   - Accept note object
   - Add title editing
4. **Create NoteView.tsx** (full-screen editor)
5. **Update DayView.tsx**
   - Switch to NoteList for date view
6. **Update Calendar components**
   - Show note counts

---

### Phase 4: Routing & Navigation

1. **Add routes:**
   - `/notes/:id` - Full-screen note editor
   - `/notes/folder/:folderId` - Folder view
   - `/notes` - Notes hub (list all folders + recent notes)

2. **Update navigation:**
   - Sidebar: Add notes section with folders
   - Search results: Link to `/notes/:id`
   - Calendar: Link to `/day/:date` or `/notes/:id`

---

### Phase 5: Sync & Export/Import

1. **Sync updates** (`src/main/sync.ts`, `src/renderer/src/lib/webSync.ts`)
   - Add note_folders to sync operations
   - Handle note conflicts by ID

2. **Export/Import** (`src/renderer/src/utils/exportImport.ts`)
   - Update schema version
   - Handle new note structure
   - No migration needed (fresh format only)

---

### Phase 6: Cleanup

1. **Remove deprecated code:**
   - Old note-by-date queries
   - Unused imports

2. **Update tests** (if applicable)

3. **Analytics updates:**
   - Track new note creation
   - Track folder usage

---

## Data Migration Strategy

### Fresh Implementation

No migration script needed. Since there are no existing users:

1. **Clear existing database**:
   - SQLite: `DROP TABLE IF EXISTS notes`
   - IndexedDB: Clear notes object store
   - Supabase: No data to migrate

2. **Create new schema**:
   - Create `note_folders` table
   - Create new `notes` table with `id` as PRIMARY KEY
   - No data transformation required

3. **Title auto-generation on note creation**:
   - If user doesn't provide title, generate `Untitled-(mm-dd-yy hh:mm:ss)`
   - Format: `Untitled-${pad(month)}-${pad(day)}-${pad(year%100)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
   - Example: `Untitled-(04-05-26 15:30:45)`
   - Auto-generated titles are editable by user

4. **User notification**:
   - Explain new features on first use (multiple notes per day, folders)
   - No migration message needed

---

## File Structure Changes

### New Files:

```
src/main/storage/note_folders.repo.ts       (NEW)
src/renderer/src/store/note_folders.store.ts (NEW)
src/renderer/src/components/notes/NoteFolderForm.tsx (NEW)
src/renderer/src/components/notes/NoteList.tsx (NEW)
src/renderer/src/components/notes/NoteView.tsx (NEW)
src/renderer/src/pages/NotesPage.tsx         (NEW)
src/renderer/src/utils/noteUtils.ts         (NEW - title generation helper)
```

### Modified Files:

```
src/renderer/src/types/models.ts             (Note, NoteFolder)
src/main/storage/db.ts                       (Schema)
src/main/storage/notes.repo.ts               (Queries)
src/main/ipc/notes.ts                        (IPC handlers)
src/renderer/src/platform/types.ts           (Interface)
src/renderer/src/platform/electron.ts        (Adapter)
src/renderer/src/platform/web.ts             (IndexedDB)
src/renderer/src/store/notes.store.ts        (State)
src/renderer/src/components/notes/NoteEditor.tsx (Editor)
src/renderer/src/components/DayView.tsx      (Tabs)
src/renderer/src/components/calendar/MonthView.tsx (Counts)
src/renderer/src/components/calendar/CalendarDay.tsx (Badge)
src/renderer/src/hooks/useSearch.ts          (Search)
src/main/sync.ts                             (Sync)
src/renderer/src/lib/webSync.ts              (Sync)
src/renderer/src/utils/exportImport.ts       (Export/Import)
src/renderer/src/App.tsx                     (Routes)
```

---

## Testing Checklist

- [ ] Create new date-based note
- [ ] Create multiple notes for same date
- [ ] Create new ad-hoc note folder
- [ ] Create ad-hoc note in folder
- [ ] Edit note title
- [ ] Delete note
- [ ] Reorder notes (drag & drop)
- [ ] View notes by date in DayView
- [ ] View notes by folder
- [ ] Search notes by title and content
- [ ] Calendar shows correct note counts
- [ ] Sync notes to cloud
- [ ] Export/import with new format
- [ ] Mobile responsive (if applicable)

---

## Risks & Considerations

1. **Breaking changes**: All existing notes will be restructured
   - Mitigation: Create migration script, backup before migration

2. **Sync conflicts**: Notes with same date from different devices
   - Mitigation: Use `updatedAt` timestamp, manual resolve if needed

3. **Performance**: Loading all notes vs lazy loading
   - Mitigation: Paginate note lists, lazy load content

4. **Database size**: More notes = larger database
   - Mitigation: Consider archiving old notes, compression

5. **User adoption**: New UI may confuse existing users
   - Mitigation: Add onboarding/tutorial for new features

---

## Timeline Estimate

| Phase                         | Effort        | Dependencies |
| ----------------------------- | ------------- | ------------ |
| Phase 1: Schema & Storage     | 1-2 days      | None         |
| Phase 2: State Management     | 0.5 day       | Phase 1      |
| Phase 3: UI Components        | 2-3 days      | Phase 2      |
| Phase 4: Routing              | 0.5 day       | Phase 3      |
| Phase 5: Sync & Import/Export | 1 day         | Phase 1-4    |
| Phase 6: Cleanup              | 0.25 day      | All phases   |
| **Total**                     | **~5-6 days** |              |

**Simplification:** Fresh implementation without migration scripts reduces timeline by ~50% (no data transformation, rollback planning, or migration testing needed).

---

## Open Questions

1. **Note titles**: Optional user input, auto-generate fallback
   - User can provide title or leave blank
   - If blank, auto-generate `Untitled-(mm-dd-yy hh:mm:ss)`
   - Auto-generated titles are editable

2. **Folder hierarchy**: Single-level folders or nested folders?
   - Recommendation: Single-level (match todo folders)

3. **Default folder**: Should ungrouped notes go to a default folder or stand alone?
   - Recommendation: Single "Ungrouped" folder for all ad-hoc notes

4. **Date-based notes in folders**: Can date-based notes be organized into folders too?
   - Recommendation: No, keep mutually exclusive (matches todo lists pattern)

5. **Note templates**: Future feature for note templates?
   - Recommendation: Defer to post-migration
