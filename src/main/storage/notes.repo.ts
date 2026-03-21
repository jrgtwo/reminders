import { getDb } from './db'
 import type { Note } from '../../renderer/src/types/models'

 export function getNoteByDate(date: string): Note | null {
   const row = getDb().prepare('SELECT * FROM notes WHERE date = ?').get(date) as any
   if (!row) return null
   return { date: row.date, content: JSON.parse(row.content), updatedAt:
 row.updated_at }
 }

 export function saveNote(n: Note): Note {
   getDb()
     .prepare(
       `INSERT INTO notes (date, content, updated_at) VALUES (@date, @content,
 @updated_at)
        ON CONFLICT(date) DO UPDATE SET content = @content, updated_at = @updated_at`
     )
     .run({ date: n.date, content: JSON.stringify(n.content), updated_at: n.updatedAt
  })
   return n
 }