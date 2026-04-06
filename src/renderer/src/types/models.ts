export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  endDate?: string
  count?: number
  byDay?: number[]
}

export interface Reminder {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  recurrence?: RecurrenceRule
  completedDates: string[]
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title?: string
  content: string
  folderId?: string
  date?: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface NoteFolder {
  id: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface TodoFolder {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface TodoList {
  id: string
  name: string
  folderId?: string // ad-hoc lists only; mutually exclusive with dueDate
  dueDate?: string // YYYY-MM-DD; date-based lists only
  order: number
  createdAt: string
  updatedAt: string
}

export interface TodoListItem {
  id: string
  listId: string
  title: string
  description?: string
  order: number
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  type: 'reminder' | 'note' | 'item'
  id: string
  date?: string
  title: string
  excerpt: string
}
