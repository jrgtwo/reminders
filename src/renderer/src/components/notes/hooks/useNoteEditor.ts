import { useEffect, useRef, useState } from 'react'
import type { Note } from '../../../types/models'

const DEBOUNCE_MS = 800

interface Params {
  note: Note
  onChange: (note: Note) => void
}

export function useNoteEditor({ note, onChange }: Params) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  function handleContentChange(markdown: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onChange({ ...note, content: markdown, updatedAt: new Date().toISOString() })
    }, DEBOUNCE_MS)
  }

  function handleTitleChange(newTitle: string) {
    onChange({ ...note, title: newTitle || undefined, updatedAt: new Date().toISOString() })
  }

  return { loaded, handleContentChange, handleTitleChange }
}
