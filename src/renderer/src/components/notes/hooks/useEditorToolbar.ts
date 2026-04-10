import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { updateLinkCommand } from '@milkdown/preset-commonmark'
import { callCommand } from '@milkdown/utils'
import type { Editor } from '@milkdown/core'

const BUTTON_W = 32
const DIVIDER_W = 16
const OVERFLOW_W = 44

export function calcVisibleCount(
  defs: Array<{ type: string }>,
  width: number
): number {
  const totalW = defs.reduce((s, d) => s + (d.type === 'divider' ? DIVIDER_W : BUTTON_W), 0)
  if (totalW <= width) return defs.length
  const available = width - OVERFLOW_W
  let used = 0
  let count = 0
  for (const def of defs) {
    const w = def.type === 'divider' ? DIVIDER_W : BUTTON_W
    if (used + w > available) break
    used += w
    count++
  }
  while (count > 0 && defs[count - 1].type === 'divider') count--
  return count
}

interface Params<T extends { type: string; key: string; command?: { key: any }; commandPayload?: unknown; special?: string }> {
  defs: T[]
  getEditor: () => Editor | undefined
}

export function useEditorToolbar<T extends { type: string; key: string; command?: { key: any }; commandPayload?: unknown; special?: string }>({ defs, getEditor }: Params<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    setVisibleCount(calcVisibleCount(defs, el.getBoundingClientRect().width))
    const ro = new ResizeObserver(([entry]) =>
      setVisibleCount(calcVisibleCount(defs, entry.contentRect.width))
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [defs])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  function handleDef(def: T) {
    if (def.type !== 'button') return
    if (def.special === 'link') {
      setDropdownOpen(false)
      setLinkOpen((o) => !o)
      return
    }
    if (!def.command) return
    getEditor()?.action(callCommand(def.command.key, def.commandPayload as never))
  }

  function submitLink() {
    if (linkUrl.trim())
      getEditor()?.action(callCommand(updateLinkCommand.key, { href: linkUrl.trim() }))
    setLinkUrl('')
    setLinkOpen(false)
  }

  function cancelLink() {
    setLinkOpen(false)
    setLinkUrl('')
  }

  const visibleDefs = defs.slice(0, visibleCount)
  const overflowDefs = defs.slice(visibleCount).filter((d) => d.type === 'button')
  const hasOverflow = overflowDefs.length > 0

  return {
    wrapperRef,
    containerRef,
    dropdownRef,
    visibleCount,
    dropdownOpen,
    setDropdownOpen,
    linkOpen,
    linkUrl,
    setLinkUrl,
    visibleDefs,
    overflowDefs,
    hasOverflow,
    handleDef,
    submitLink,
    cancelLink,
    OVERFLOW_W,
  }
}
