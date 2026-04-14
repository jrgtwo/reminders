import { z } from 'zod'

// --- Primitives ---

export const Id = z.string().uuid()
export const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date')
export const TimeStr = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM time')

// --- Reminders ---

const RecurrenceRule = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive(),
  endDate: z.string().optional(),
  count: z.number().int().positive().optional(),
  byDay: z.array(z.number().int()).optional(),
})

export const ReminderSchema = z.object({
  id: Id,
  title: z.string().max(2000),
  description: z.string().max(10000).optional(),
  date: DateStr,
  endDate: DateStr.optional(),
  startTime: TimeStr.optional(),
  endTime: TimeStr.optional(),
  recurrence: RecurrenceRule.optional(),
  completedDates: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// --- Notes ---

export const NoteSchema = z.object({
  id: Id,
  title: z.string().max(2000).optional(),
  content: z.string().max(500000),
  folderId: Id.optional(),
  date: DateStr.optional(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const NoteFolderSchema = z.object({
  id: Id,
  name: z.string().max(500),
  displayOrder: z.number().int(),
  parentId: Id.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// --- Todo Folders ---

export const TodoFolderSchema = z.object({
  id: Id,
  name: z.string().max(500),
  order: z.number().int(),
  parentId: Id.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// --- Todo Lists ---

export const TodoListSchema = z.object({
  id: Id,
  name: z.string().max(2000),
  folderId: Id.optional(),
  dueDate: DateStr.optional(),
  order: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const TodoListItemSchema = z.object({
  id: Id,
  listId: Id,
  title: z.string().max(2000),
  description: z.string().max(10000).optional(),
  order: z.number().int(),
  completed: z.boolean(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
