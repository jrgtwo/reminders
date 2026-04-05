import { getStorage } from '../platform'
import { useRemindersStore } from '../store/reminders.store'
import { useTodoListsStore } from '../store/todo_lists.store'
import type { Reminder, Note, TodoList, TodoListItem } from '../types/models'

const SCHEMA_VERSION = 2

interface ExportData {
  schemaVersion: number
  exportedAt: string
  reminders: Reminder[]
  notes: Note[]
  lists: TodoList[]
  items: TodoListItem[]
}

async function buildExportData(): Promise<string> {
  const storage = getStorage()
  const lists = await storage.getTodoLists()
  const [reminders, notes, allItems] = await Promise.all([
    storage.getReminders(),
    storage.getAllNotes(),
    Promise.all(lists.map((l) => storage.getTodoListItems(l.id))).then((arr) => arr.flat()),
  ])
  const data: ExportData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    reminders,
    notes,
    lists,
    items: allItems,
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
    !Array.isArray(data.lists)
  ) {
    return { success: false, message: 'Invalid export file format' }
  }

  const items: TodoListItem[] = Array.isArray(data.items) ? data.items : []

  try {
    const storage = getStorage()
    for (const r of data.reminders) await storage.saveReminder(r)
    for (const n of data.notes) await storage.saveNote(n)
    for (const l of data.lists) await storage.saveTodoList(l)
    for (const i of items) await storage.saveTodoListItem(i)

    await useRemindersStore.getState().load()
    await useTodoListsStore.getState().load()

    return {
      success: true,
      message: `Imported ${data.reminders.length} reminders, ${data.notes.length} notes, ${data.lists.length} lists, ${items.length} items`,
    }
  } catch {
    return { success: false, message: 'Import failed — error saving data' }
  }
}
