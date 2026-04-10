import { useEffect, useState } from 'react'

interface Params {
  title: string | undefined
  onSaveTitle: (title: string) => void
}

export function useTitleBar({ title, onSaveTitle }: Params) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(title || '')

  useEffect(() => {
    setTitleValue(title || '')
  }, [title])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSaveTitle(titleValue)
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setTitleValue(title || '')
      setIsEditing(false)
    }
  }

  function handleBlur() {
    onSaveTitle(titleValue)
    setIsEditing(false)
  }

  return { isEditing, setIsEditing, titleValue, setTitleValue, handleSubmit, handleKeyDown, handleBlur }
}
