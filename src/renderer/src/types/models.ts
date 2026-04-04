export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

  export interface RecurrenceRule {
    frequency: RecurrenceFrequency
    interval: number       // every N units (e.g. every 2 weeks)
    endDate?: string       // 'YYYY-MM-DD', undefined = forever
    count?: number         // end after N occurrences
    byDay?: number[]       // 0–6 (Sun–Sat), used for weekly recurrence
  }

  export interface Reminder {
    id: string             // crypto.randomUUID()
    title: string
    description?: string
    date: string           // 'YYYY-MM-DD' base date
    time?: string          // 'HH:MM', triggers system notification
    recurrence?: RecurrenceRule
    completedDates: string[] // ISO dates of completed occurrences
    createdAt: string
    updatedAt: string
  }

  export interface Note {
    date: string           // 'YYYY-MM-DD' — one note per day, used as primary key
    content: string        // Markdown text
    updatedAt: string
  }

  export interface Todo {
    id: string
    title: string
    description?: string
    dueDate?: string       // 'YYYY-MM-DD', optional — undated todos are global
    listId?: string        // links to a named TodoList; undefined = Anytime/global
    order: number          // float gap (1000, 2000…) for drag-to-reorder
    completed: boolean
    completedAt?: string
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
    folderId?: string
    order: number
    createdAt: string
    updatedAt: string
  }

  export interface SearchResult {
    type: 'reminder' | 'note' | 'todo'
    id: string
    date?: string
    title: string
    excerpt: string
  }