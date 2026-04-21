import { useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm, toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  toggleInlineCodeCommand,
} from '@milkdown/preset-commonmark'
import { callCommand } from '@milkdown/utils'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function TBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[var(--bg-elevated)] hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      {icon}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inner editor (must be inside MilkdownProvider)
// ---------------------------------------------------------------------------

interface InnerProps {
  initialContent: string
  onChange: (md: string) => void
  minHeight?: string
  autoFocus?: boolean
  readOnly?: boolean
}

function InnerEditor({ initialContent, onChange, minHeight = '5.5lh', autoFocus, readOnly }: InnerProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const editorWrapRef = useRef<HTMLDivElement>(null)

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
    []
  )

  const runCommand = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cmd: { key: any }) => {
      get()?.action(callCommand(cmd.key))
    },
    [get]
  )

  return (
    <>
      {/* Compact toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 dark:border-white/[0.06]">
          <TBtn icon={<Bold size={15} />} label="Bold" onClick={() => runCommand(toggleStrongCommand)} />
          <TBtn icon={<Italic size={15} />} label="Italic" onClick={() => runCommand(toggleEmphasisCommand)} />
          <TBtn icon={<Strikethrough size={15} />} label="Strikethrough" onClick={() => runCommand(toggleStrikethroughCommand)} />
          <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.08] mx-0.5" />
          <TBtn icon={<List size={15} />} label="Bullet list" onClick={() => runCommand(wrapInBulletListCommand)} />
          <TBtn icon={<ListOrdered size={15} />} label="Ordered list" onClick={() => runCommand(wrapInOrderedListCommand)} />
          <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.08] mx-0.5" />
          <TBtn icon={<Code size={15} />} label="Inline code" onClick={() => runCommand(toggleInlineCodeCommand)} />
        </div>
      )}

      {/* Editor content — resize-y on the wrapper, min-height on ProseMirror */}
      <div
        ref={editorWrapRef}
        onClick={() => {
          if (readOnly) return
          const pm = editorWrapRef.current?.querySelector('.ProseMirror') as HTMLElement | null
          pm?.focus()
        }}
        className={`cursor-text
          px-3 py-2 text-sm text-gray-900 dark:text-gray-100
          overflow-y-auto resize-y
          [&_.milkdown]:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:whitespace-pre-wrap
          [&_.ProseMirror]:caret-[var(--accent)]
          [&_.ProseMirror_p]:mb-1 [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ul]:mb-1
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_ol]:mb-1
          [&_.ProseMirror_li]:mb-0
          [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-[var(--border)] [&_.ProseMirror_blockquote]:pl-2 [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_code]:bg-gray-200 [&_.ProseMirror_code]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_pre]:bg-gray-200 [&_.ProseMirror_pre]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_pre]:p-2 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:mb-1 [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_a]:text-[var(--accent)] [&_.ProseMirror_a]:underline
          [&_.ProseMirror_strong]:font-semibold
          [&_.ProseMirror_em]:italic
          [&_.ProseMirror_s]:line-through
          ${autoFocus ? '[&_.ProseMirror]:focus' : ''}
        `}
        style={{ minHeight }}
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
  value: string
  onChange: (md: string) => void
  minHeight?: string
  autoFocus?: boolean
  readOnly?: boolean
  className?: string
}

export default function RichTextDescription({
  value,
  onChange,
  minHeight,
  autoFocus,
  readOnly,
  className = '',
}: Props) {
  return (
    <div
      inert={readOnly || undefined}
      className={`rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-elevated)] overflow-hidden focus-within:border-[var(--accent-ring)] focus-within:ring-1 focus-within:ring-[var(--accent-ring)] ${className}`}
    >
      <MilkdownProvider>
        <InnerEditor
          initialContent={value}
          onChange={onChange}
          minHeight={minHeight}
          autoFocus={autoFocus}
          readOnly={readOnly}
        />
      </MilkdownProvider>
    </div>
  )
}
