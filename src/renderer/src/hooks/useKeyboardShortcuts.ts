import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../store/ui.store'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable
  )
}

export function useKeyboardShortcuts(onFocusSearch: () => void): void {
  const navigate = useNavigate()
  const setTriggerNewTodo = useUIStore((s) => s.setTriggerNewTodo)
  const setTriggerNewReminder = useUIStore((s) => s.setTriggerNewReminder)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ctrl/Cmd+, → settings (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
        return
      }

      if (isTypingTarget(e.target)) return

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onFocusSearch()
        return
      }

      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        setTriggerNewTodo(true)
        return
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        setTriggerNewReminder(true)
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate, onFocusSearch, setTriggerNewTodo, setTriggerNewReminder])
}
