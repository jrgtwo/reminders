import { getStorage } from '../platform'
import { useRemindersStore } from '../store/reminders.store'
import { useTodosStore } from '../store/todos.store'
import type { Reminder, Note, Todo } from '../types/models'

const SCHEMA_VERSION = 1

interface ExportData {
  schemaVersion: number
  exportedAt: string
  reminders: Reminder[]
  notes: Note[]
  todos: Todo[]
}

async function buildExportData(): Promise<string> {
  const storage = getStorage()
  const [reminders, notes, todos] = await Promise.all([
    storage.getReminders(),
    storage.getAllNotes(),
    storage.getTodos(),
  ])
  const data: ExportData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    reminders,
    notes,
    todos,
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

  // Web fallback
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
    !Array.isArray(data.todos) ||
    !Array.isArray(data.notes)
  ) {
    return { success: false, message: 'Invalid export file format' }
  }

  try {
    const storage = getStorage()
    for (const r of data.reminders) await storage.saveReminder(r)
    for (const n of data.notes) await storage.saveNote(n)
    for (const t of data.todos) await storage.saveTodo(t)

    await useRemindersStore.getState().load()
    await useTodosStore.getState().load()

    return {
      success: true,
      message: `Imported ${data.reminders.length} reminders, ${data.notes.length} notes, ${data.todos.length} todos`,
    }
  } catch {
    return { success: false, message: 'Import failed — error saving data' }
  }
}
