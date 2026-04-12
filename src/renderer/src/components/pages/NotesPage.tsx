import { useOutlet } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'
import NotesNav, { type NotesNavHandle } from '../notes/NotesNav'
import SidebarAddButton from '../ui/SidebarAddButton'
import SidebarHeader from '../ui/SidebarHeader'
import MobilePageHeader from '../ui/MobilePageHeader'

const MIN_WIDTH = 160
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 256

function NotesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <FileText size={40} className="text-slate-200 dark:text-white/10" />
      <p className="text-sm text-slate-400 dark:text-white/50">Select a note or create a new one</p>
    </div>
  )
}

export default function NotesPage() {
  const outlet = useOutlet()
  const hasNote = !!outlet
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)
  const notesNavRef = useRef<NotesNavHandle>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      setSidebarWidth(next)
      if (collapsed) setCollapsed(false)
    }

    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [sidebarWidth, collapsed])

  const effectiveWidth = collapsed ? 44 : sidebarWidth

  return (
    <div className="h-full flex overflow-hidden">
      {/* Mobile sidebar: full-width when no note open, hidden otherwise */}
      <div className={`md:hidden shrink-0 border-r border-slate-200 dark:border-white/[0.07] bg-[var(--bg-app)] w-full flex flex-col ${hasNote ? 'hidden' : 'flex'}`}>
        <MobilePageHeader title="Notes" />
        <div className="flex-1 overflow-y-auto">
          <NotesNav ref={notesNavRef} />
        </div>
        <SidebarAddButton label="New Note" onClick={() => notesNavRef.current?.openNewNote()} />
      </div>

      {/* Desktop sidebar: resizable + collapsible */}
      <div
        className="hidden md:flex md:flex-col shrink-0 border-r border-slate-300/60 dark:border-white/[0.07] overflow-hidden bg-[var(--bg-app)] relative transition-[width] duration-100"
        style={{ width: effectiveWidth }}
      >
        <SidebarHeader
          title="Notes"
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          side="left"
        />
        {!collapsed && (
          <div className="flex-1 overflow-y-auto" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
            <NotesNav />
          </div>
        )}
      </div>

      {/* Resize handle (desktop only) */}
      <div className="hidden md:block shrink-0 relative" style={{ width: 0 }}>
        <div
          className="absolute inset-y-0 -left-1 w-2 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors z-10 group"
          onMouseDown={onMouseDown}
        >
          <div className="absolute inset-y-0 left-[3px] w-px bg-transparent group-hover:bg-blue-500/40 transition-colors" />
        </div>
      </div>

      {/* Right panel */}
      <div
        className={`flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]
          ${hasNote ? 'flex' : 'hidden md:flex'}`}
      >
        {outlet ?? <NotesEmptyState />}
      </div>
    </div>
  )
}
