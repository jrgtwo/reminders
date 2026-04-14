import { getStorage } from '../platform'
import { useRemindersStore } from '../store/reminders.store'
import { useTodoListsStore } from '../store/todo_lists.store'
import { useNoteFoldersStore } from '../store/note_folders.store'
import type { Reminder, Note, NoteFolder, TodoList, TodoListItem } from '../types/models'
import { remindersToIcal } from './icalExport'
import { parseIcal } from './icalImport'
import {
  ReminderSchema,
  NoteSchema,
  NoteFolderSchema,
  TodoListSchema,
  TodoListItemSchema,
} from '../../../shared/schemas'

const SCHEMA_VERSION = 3

interface ExportData {
  schemaVersion: number
  exportedAt: string
  reminders: Reminder[]
  notes: Note[]
  noteFolders: NoteFolder[]
  lists: TodoList[]
  items: TodoListItem[]
}

async function buildExportData(): Promise<string> {
  const storage = getStorage()
  const lists = await storage.getTodoLists()
  const [reminders, notes, noteFolders, allItems] = await Promise.all([
    storage.getReminders(),
    storage.getAllNotes(),
    storage.getAllNoteFolders(),
    Promise.all(lists.map((l) => storage.getTodoListItems(l.id))).then((arr) => arr.flat())
  ])
  const data: ExportData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    reminders,
    notes,
    noteFolders,
    lists,
    items: allItems
  }
  return JSON.stringify(data, null, 2)
}

export async function exportToFile(): Promise<void> {
  const json = await buildExportData()
  const filename = `reminders-export-${new Date().toISOString().slice(0, 10)}.json`

  const api = (window as any).electronAPI
  if (api?.dialog) {
    await api.dialog.save(filename, json)
    return
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromFile(): Promise<{ success: boolean; message: string }> {
  let json: string | null = null

  const api = (window as any).electronAPI
  if (api?.dialog) {
    json = await api.dialog.open()
  } else {
    json = await new Promise<string | null>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) {
          resolve(null)
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(file)
      }
      input.click()
    })
  }

  if (!json) return { success: false, message: 'No file selected' }

  let data: ExportData
  try {
    data = JSON.parse(json) as ExportData
  } catch {
    return { success: false, message: 'Failed to parse file — not valid JSON' }
  }

  if (
    !data.schemaVersion ||
    !Array.isArray(data.reminders) ||
    !Array.isArray(data.notes) ||
    !Array.isArray(data.noteFolders) ||
    !Array.isArray(data.lists)
  ) {
    return { success: false, message: 'Invalid export file format' }
  }

  const rawItems: unknown[] = Array.isArray(data.items) ? data.items : []

  // Validate every record before saving anything
  const invalid: string[] = []
  const reminders: Reminder[] = []
  const notes: Note[] = []
  const noteFolders: NoteFolder[] = []
  const lists: TodoList[] = []
  const items: TodoListItem[] = []

  for (const r of data.reminders) {
    const result = ReminderSchema.safeParse(r)
    if (result.success) reminders.push(result.data as Reminder)
    else invalid.push(`reminder: ${result.error.issues[0]?.message}`)
  }
  for (const n of data.notes) {
    const result = NoteSchema.safeParse(n)
    if (result.success) notes.push(result.data as Note)
    else invalid.push(`note: ${result.error.issues[0]?.message}`)
  }
  for (const f of data.noteFolders) {
    const result = NoteFolderSchema.safeParse(f)
    if (result.success) noteFolders.push(result.data as NoteFolder)
    else invalid.push(`note folder: ${result.error.issues[0]?.message}`)
  }
  for (const l of data.lists) {
    const result = TodoListSchema.safeParse(l)
    if (result.success) lists.push(result.data as TodoList)
    else invalid.push(`list: ${result.error.issues[0]?.message}`)
  }
  for (const i of rawItems) {
    const result = TodoListItemSchema.safeParse(i)
    if (result.success) items.push(result.data as TodoListItem)
    else invalid.push(`list item: ${result.error.issues[0]?.message}`)
  }

  if (reminders.length === 0 && notes.length === 0 && lists.length === 0 && noteFolders.length === 0 && items.length === 0) {
    return { success: false, message: `No valid records found. ${invalid.length} records failed validation.` }
  }

  try {
    const storage = getStorage()
    for (const r of reminders) await storage.saveReminder(r)
    for (const n of notes) await storage.saveNote(n)
    for (const f of noteFolders) await storage.saveNoteFolder(f)
    for (const l of lists) await storage.saveTodoList(l)
    for (const i of items) await storage.saveTodoListItem(i)

    await useRemindersStore.getState().load()
    await useTodoListsStore.getState().load()
    await useNoteFoldersStore.getState().load()

    const skipped = invalid.length > 0 ? ` (${invalid.length} skipped — invalid)` : ''
    return {
      success: true,
      message: `Imported ${reminders.length} reminders, ${notes.length} notes, ${noteFolders.length} note folders, ${lists.length} lists, ${items.length} items${skipped}`,
    }
  } catch {
    return { success: false, message: 'Import failed — error saving data' }
  }
}

export async function exportToIcalFile(): Promise<void> {
  const storage = getStorage()
  const reminders = await storage.getReminders()
  const icsContent = remindersToIcal(reminders)
  const filename = `reminders-export-${new Date().toISOString().slice(0, 10)}.ics`

  const api = (window as any).electronAPI
  if (api?.dialog) {
    await api.dialog.save(filename, icsContent)
    return
  }

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromIcalFile(): Promise<{ success: boolean; message: string }> {
  let icsText: string | null = null

  const api = (window as any).electronAPI
  if (api?.dialog) {
    icsText = await api.dialog.open()
  } else {
    icsText = await new Promise<string | null>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.ics,text/calendar'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) { resolve(null); return }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(file)
      }
      input.click()
    })
  }

  if (!icsText) return { success: false, message: 'No file selected' }

  let result: ReturnType<typeof parseIcal>
  try {
    result = parseIcal(icsText)
  } catch {
    return { success: false, message: 'Failed to parse file — not a valid iCal file' }
  }

  if (result.reminders.length === 0) {
    return { success: false, message: 'No calendar events found in file' }
  }

  try {
    const storage = getStorage()
    for (const r of result.reminders) await storage.saveReminder(r)
    await useRemindersStore.getState().load()

    const skippedNote = result.skipped > 0 ? `, ${result.skipped} skipped (missing title or date)` : ''
    return {
      success: true,
      message: `Imported ${result.reminders.length} reminder${result.reminders.length !== 1 ? 's' : ''}${skippedNote}`,
    }
  } catch {
    return { success: false, message: 'Import failed — error saving data' }
  }
}
