import { z } from 'zod'

// Re-export model schemas from shared location
export {
  Id,
  DateStr,
  TimeStr,
  ReminderSchema,
  NoteSchema,
  NoteFolderSchema,
  TodoFolderSchema,
  TodoListSchema,
  TodoListItemSchema,
} from '../../shared/schemas'

// --- Sync ---

export const SyncConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1),
})

export const SessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  user: z.object({ id: z.string().uuid() }),
})

// --- Auth ---

export const ExternalUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('https://'), { message: 'Only HTTPS URLs are allowed' })

// --- Safe Storage ---

export const UserIdSchema = z.string().uuid()

// --- Window / Dialog ---

export const DialogSaveSchema = z.object({
  defaultName: z
    .string()
    .max(255)
    .refine((n) => !n.includes('..') && !n.includes('/') && !n.includes('\\'), {
      message: 'Invalid file name',
    }),
  data: z.string().max(10 * 1024 * 1024),
})
