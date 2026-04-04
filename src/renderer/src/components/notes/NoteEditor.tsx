import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm, toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { history, undoCommand, redoCommand } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  toggleInlineCodeCommand,
  createCodeBlockCommand,
  insertHrCommand,
  updateLinkCommand,
} from '@milkdown/preset-commonmark'
import type { $Command } from '@milkdown/utils'
import { callCommand } from '@milkdown/utils'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  FileCode,
  Minus,
  Link2,
  MoreHorizontal,
} from 'lucide-react'
import { useNotesStore } from '../../store/notes.store'

const DEBOUNCE_MS = 800
const BUTTON_W = 32
const DIVIDER_W = 16
const OVERFLOW_W = 44

// ---------------------------------------------------------------------------
// Toolbar item definitions
// ---------------------------------------------------------------------------

type ToolbarDef =
  | { type: 'divider'; key: string }
  | {
      type: 'button'
      key: string
      label: string
      icon: ReactNode
      command?: $Command<any>
      commandPayload?: unknown
      special?: 'link'
    }

const DEFS: ToolbarDef[] = [
  { type: 'button', key: 'undo',       label: 'Undo',             icon: <Undo2 size={14} />,        command: undoCommand },
  { type: 'button', key: 'redo',       label: 'Redo',             icon: <Redo2 size={14} />,        command: redoCommand },
  { type: 'divider', key: 'd1' },
  { type: 'button', key: 'h1',         label: 'Heading 1',        icon: <Heading1 size={14} />,     command: wrapInHeadingCommand, commandPayload: 1 },
  { type: 'button', key: 'h2',         label: 'Heading 2',        icon: <Heading2 size={14} />,     command: wrapInHeadingCommand, commandPayload: 2 },
  { type: 'button', key: 'h3',         label: 'Heading 3',        icon: <Heading3 size={14} />,     command: wrapInHeadingCommand, commandPayload: 3 },
  { type: 'divider', key: 'd2' },
  { type: 'button', key: 'bold',       label: 'Bold',             icon: <Bold size={14} />,         command: toggleStrongCommand },
  { type: 'button', key: 'italic',     label: 'Italic',           icon: <Italic size={14} />,       command: toggleEmphasisCommand },
  { type: 'button', key: 'strike',     label: 'Strikethrough',    icon: <Strikethrough size={14} />, command: toggleStrikethroughCommand },
  { type: 'divider', key: 'd3' },
  { type: 'button', key: 'bullet',     label: 'Bullet list',      icon: <List size={14} />,         command: wrapInBulletListCommand },
  { type: 'button', key: 'ordered',    label: 'Ordered list',     icon: <ListOrdered size={14} />,  command: wrapInOrderedListCommand },
  { type: 'button', key: 'blockquote', label: 'Blockquote',       icon: <Quote size={14} />,        command: wrapInBlockquoteCommand },
  { type: 'divider', key: 'd4' },
  { type: 'button', key: 'code',       label: 'Inline code',      icon: <Code size={14} />,         command: toggleInlineCodeCommand },
  { type: 'button', key: 'codeblock',  label: 'Code block',       icon: <FileCode size={14} />,     command: createCodeBlockCommand },
  { type: 'button', key: 'hr',         label: 'Horizontal rule',  icon: <Minus size={14} />,        command: insertHrCommand },
  { type: 'button', key: 'link',       label: 'Link',             icon: <Link2 size={14} />,        special: 'link' },
]

function calcVisibleCount(width: number): number {
  const totalW = DEFS.reduce((s, d) => s + (d.type === 'divider' ? DIVIDER_W : BUTTON_W), 0)
  if (totalW <= width) return DEFS.length
  const available = width - OVERFLOW_W
  let used = 0
  let count = 0
  for (const def of DEFS) {
    const w = def.type === 'divider' ? DIVIDER_W : BUTTON_W
    if (used + w > available) break
    used += w
    count++
  }
  while (count > 0 && DEFS[count - 1].type === 'divider') count--
  return count
}

function TBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[var(--bg-elevated)] hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      {icon}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Combined editor + toolbar
// ---------------------------------------------------------------------------

interface InnerProps {
  initialContent: string
  onChange: (md: string) => void
}

function EditorWithToolbar({ initialContent, onChange }: InnerProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const { get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, initialContent)
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          onChangeRef.current(markdown)
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener),
  )

  // --- Toolbar state ---
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(DEFS.length)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const handleDef = (def: ToolbarDef) => {
    if (def.type !== 'button') return
    if (def.special === 'link') {
      setDropdownOpen(false)
      setLinkOpen((o) => !o)
      return
    }
    if (!def.command) return
    get()?.action(callCommand(def.command.key, def.commandPayload as never))
  }

  const submitLink = () => {
    if (linkUrl.trim()) get()?.action(callCommand(updateLinkCommand.key, { href: linkUrl.trim() }))
    setLinkUrl('')
    setLinkOpen(false)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setVisibleCount(calcVisibleCount(entry.contentRect.width)),
    )
    ro.observe(el)
    setVisibleCount(calcVisibleCount(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  type ButtonDef = Extract<ToolbarDef, { type: 'button' }>
  const visibleDefs = DEFS.slice(0, visibleCount)
  const overflowDefs = DEFS.slice(visibleCount).filter((d): d is ButtonDef => d.type === 'button')
  const hasOverflow = overflowDefs.length > 0

  return (
    <>
      {/* Toolbar */}
      <div className="border-b border-slate-100 dark:border-white/[0.05]">
        <div ref={containerRef} className="flex items-center gap-0.5 px-2 py-1">
          {visibleDefs.map((def) =>
            def.type === 'divider' ? (
              <div key={def.key} className="w-px h-5 bg-gray-200 dark:bg-[var(--bg-elevated)] mx-1 flex-shrink-0" />
            ) : (
              <TBtn key={def.key} icon={def.icon} label={def.label} onClick={() => handleDef(def)} />
            ),
          )}
          {hasOverflow && (
            <div ref={dropdownRef} className="relative flex-shrink-0 ml-auto">
              <TBtn
                icon={<MoreHorizontal size={14} />}
                label="More"
                onClick={() => setDropdownOpen((o) => !o)}
              />
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[168px]">
                  {overflowDefs.map((def) => (
                    <button
                      key={def.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleDef(def)}
                      className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <span className="text-gray-500 dark:text-gray-400">{def.icon}</span>
                      {def.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {linkOpen && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitLink()
                if (e.key === 'Escape') { setLinkOpen(false); setLinkUrl('') }
              }}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={submitLink}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => { setLinkOpen(false); setLinkUrl('') }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div
        className="
          px-4 py-4 text-[15px] font-normal text-gray-900 dark:text-gray-100
          [&_.milkdown]:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:whitespace-pre-wrap
          [&_.ProseMirror]:min-h-[360px]
          [&_.ProseMirror]:caret-[#6498c8]
          [&_.ProseMirror]:font-normal
          [&_.ProseMirror_p]:mb-2
          [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h1]:mt-1
          [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-1
          [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-1
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-2
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-2
          [&_.ProseMirror_li]:mb-0.5
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-[var(--border)] [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-gray-500 [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_code]:bg-gray-200 [&_.ProseMirror_code]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_pre]:bg-gray-200 [&_.ProseMirror_pre]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:mb-2 [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline
          [&_.ProseMirror_strong]:font-semibold
          [&_.ProseMirror_em]:italic
          [&_.ProseMirror_s]:line-through
          [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:dark:border-[var(--border)] [&_.ProseMirror_hr]:my-3
        "
      >
        <Milkdown />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface Props {
  date: string
}

export default function NoteEditor({ date }: Props) {
  const notes = useNotesStore((s) => s.notes)
  const loadNote = useNotesStore((s) => s.loadNote)
  const saveNote = useNotesStore((s) => s.saveNote)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    loadNote(date).then(() => setLoaded(true))
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [date, loadNote])

  function handleChange(markdown: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveNote({ date, content: markdown, updatedAt: new Date().toISOString() })
    }, DEBOUNCE_MS)
  }

  const initialContent =
    notes[date]?.content && typeof notes[date].content === 'string' ? notes[date].content : ''

  if (!loaded) return <div className="mb-8 min-h-[200px]" />

  return (
    <div className="mb-8 min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03]">
      <MilkdownProvider key={date}>
        <EditorWithToolbar initialContent={initialContent} onChange={handleChange} />
      </MilkdownProvider>
    </div>
  )
}
