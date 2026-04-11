import { useRef, useState } from 'react'
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
} from '@milkdown/preset-commonmark'
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
  ArrowLeft,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import type { NoteFolder } from '../../types/models'
import { buildFolderTree } from '../../lib/folderTree'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { useEditorToolbar } from './hooks/useEditorToolbar'
import { useNoteView } from './hooks/useNoteView'
import { useTitleBar } from './hooks/useTitleBar'

const OVERFLOW_W = 44

type ToolbarDef =
  | { type: 'divider'; key: string }
  | {
      type: 'button'
      key: string
      label: string
      icon: React.ReactNode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      command?: { key: any }
      commandPayload?: unknown
      special?: 'link'
    }

const DEFS: ToolbarDef[] = [
  { type: 'button', key: 'undo', label: 'Undo', icon: <Undo2 size={20} />, command: undoCommand },
  { type: 'button', key: 'redo', label: 'Redo', icon: <Redo2 size={20} />, command: redoCommand },
  { type: 'divider', key: 'd1' },
  {
    type: 'button',
    key: 'h1',
    label: 'Heading 1',
    icon: <Heading1 size={20} />,
    command: wrapInHeadingCommand,
    commandPayload: 1
  },
  {
    type: 'button',
    key: 'h2',
    label: 'Heading 2',
    icon: <Heading2 size={20} />,
    command: wrapInHeadingCommand,
    commandPayload: 2
  },
  {
    type: 'button',
    key: 'h3',
    label: 'Heading 3',
    icon: <Heading3 size={20} />,
    command: wrapInHeadingCommand,
    commandPayload: 3
  },
  { type: 'divider', key: 'd2' },
  {
    type: 'button',
    key: 'bold',
    label: 'Bold',
    icon: <Bold size={20} />,
    command: toggleStrongCommand
  },
  {
    type: 'button',
    key: 'italic',
    label: 'Italic',
    icon: <Italic size={20} />,
    command: toggleEmphasisCommand
  },
  {
    type: 'button',
    key: 'strike',
    label: 'Strikethrough',
    icon: <Strikethrough size={20} />,
    command: toggleStrikethroughCommand
  },
  { type: 'divider', key: 'd3' },
  {
    type: 'button',
    key: 'bullet',
    label: 'Bullet list',
    icon: <List size={20} />,
    command: wrapInBulletListCommand
  },
  {
    type: 'button',
    key: 'ordered',
    label: 'Ordered list',
    icon: <ListOrdered size={20} />,
    command: wrapInOrderedListCommand
  },
  {
    type: 'button',
    key: 'blockquote',
    label: 'Blockquote',
    icon: <Quote size={20} />,
    command: wrapInBlockquoteCommand
  },
  { type: 'divider', key: 'd4' },
  {
    type: 'button',
    key: 'code',
    label: 'Inline code',
    icon: <Code size={20} />,
    command: toggleInlineCodeCommand
  },
  {
    type: 'button',
    key: 'codeblock',
    label: 'Code block',
    icon: <FileCode size={20} />,
    command: createCodeBlockCommand
  },
  {
    type: 'button',
    key: 'hr',
    label: 'Horizontal rule',
    icon: <Minus size={20} />,
    command: insertHrCommand
  },
  { type: 'button', key: 'link', label: 'Link', icon: <Link2 size={20} />, special: 'link' }
]


function TBtn({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
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
      .use(listener)
  )

  const {
    wrapperRef,
    containerRef,
    dropdownRef,
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
  } = useEditorToolbar({ defs: DEFS, getEditor: get })

  return (
    <>
      <div className="border-b border-slate-100 dark:border-white/[0.05] relative">
        {/* overflow-hidden clips the button row so it can never widen the page;
            ResizeObserver on this div always gets the true available width */}
        <div ref={wrapperRef} className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex items-center gap-0.5 px-2 py-1"
            style={{ paddingRight: hasOverflow ? OVERFLOW_W + 8 : undefined }}
          >
            {visibleDefs.map((def) =>
              def.type === 'divider' ? (
                <div
                  key={def.key}
                  className="w-px h-5 bg-gray-200 dark:bg-[var(--bg-elevated)] mx-1 flex-shrink-0"
                />
              ) : (
                <TBtn
                  key={def.key}
                  icon={def.icon}
                  label={def.label}
                  onClick={() => handleDef(def)}
                />
              )
            )}
          </div>
        </div>
        {/* ... button lives outside overflow-hidden so the dropdown is never clipped */}
        {hasOverflow && (
          <div ref={dropdownRef} className="absolute right-2 top-1 z-10 bg-[var(--bg-app)]">
            <TBtn
              icon={<MoreHorizontal size={20} />}
              label="More"
              onClick={() => setDropdownOpen((o) => !o)}
            />
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[168px]">
                {overflowDefs.map((def) => {
                  if (def.type === 'divider') return null
                  return (
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
                  )
                })}
              </div>
            )}
          </div>
        )}

        {linkOpen && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitLink()
                if (e.key === 'Escape') cancelLink()
              }}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={submitLink}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-[#f0f0f0] text-sm rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={cancelLink}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="px-4 py-4 text-[15px] font-normal text-gray-900 dark:text-gray-100 [&_.milkdown]:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:min-h-[360px] [&_.ProseMirror]:caret-[#6498c8] [&_.ProseMirror]:font-normal [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0 [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h1]:mt-1 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-1 [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-2 [&_.ProseMirror_li]:mb-0.5 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-[var(--border)] [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-gray-500 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_code]:bg-gray-200 [&_.ProseMirror_code]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:font-mono [&_.ProseMirror_pre]:bg-gray-200 [&_.ProseMirror_pre]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:mb-2 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_s]:line-through [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:dark:border-[var(--border)] [&_.ProseMirror_hr]:my-3">
        <Milkdown />
      </div>
    </>
  )
}

interface TitleBarProps {
  title: string | undefined
  folderId: string | undefined
  folders: NoteFolder[]
  onSaveTitle: (title: string) => void
  onFolderChange: (folderId: string | undefined) => void
  onDelete: (e: React.MouseEvent) => void
  onBack: () => void
}

function buildFolderOptions(
  folders: NoteFolder[]
): { id: string; name: string; depth: number }[] {
  const childrenMap = buildFolderTree(folders)
  const result: { id: string; name: string; depth: number }[] = []

  function walk(parentId: string | undefined, depth: number) {
    const children = (childrenMap.get(parentId) ?? []).sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
    for (const folder of children) {
      result.push({ id: folder.id, name: folder.name, depth })
      walk(folder.id, depth + 1)
    }
  }

  walk(undefined, 0)
  return result
}

function TitleBar({ title, folderId, folders, onSaveTitle, onFolderChange, onDelete, onBack }: TitleBarProps) {
  const { isEditing, setIsEditing, titleValue, setTitleValue, handleSubmit, handleKeyDown, handleBlur } =
    useTitleBar({ title, onSaveTitle })

  const folderOptions = buildFolderOptions(folders)

  return (
    <div className="flex flex-col border-b border-slate-100 dark:border-white/[0.05]">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex-1">
            <input
              autoFocus
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-blue-500 focus:outline-none pb-1"
              placeholder="Untitled"
            />
          </form>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex-1 text-left">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title || 'Untitled'}
            </h1>
          </button>
        )}
        <button
          onClick={(e) => onDelete(e)}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete note"
        >
          <Trash2 size={20} />
        </button>
      </div>
      {folders.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-2">
          <FolderOpen size={14} className="text-slate-400 dark:text-white/25 shrink-0" />
          <select
            value={folderId ?? ''}
            onChange={(e) => onFolderChange(e.target.value || undefined)}
            className="text-[12px] text-slate-600 dark:text-white/60 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-white/[0.08] rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">No folder</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {'\u00A0\u00A0'.repeat(f.depth) + (f.depth > 0 ? '└ ' : '') + f.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export default function NoteView() {
  const {
    id,
    note,
    folders,
    deleteDialogOpen,
    setDeleteDialogOpen,
    navigate,
    handleContentChange,
    handleTitleChange,
    handleFolderChange,
    handleDelete,
  } = useNoteView()

  const [deleteAnchorRect, setDeleteAnchorRect] = useState<DOMRect | null>(null)

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Note not found</p>
          <button
            onClick={() => navigate('/notes')}
            className="mt-4 text-blue-600 dark:text-[#6498c8] hover:underline"
          >
            Back to Notes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <TitleBar
        title={note.title}
        folderId={note.folderId}
        folders={folders}
        onSaveTitle={handleTitleChange}
        onFolderChange={handleFolderChange}
        onDelete={(e) => {
          setDeleteAnchorRect((e.currentTarget as HTMLElement).getBoundingClientRect())
          setDeleteDialogOpen(true)
        }}
        onBack={() => navigate('/notes')}
      />
      <div className="flex-1 overflow-y-auto">
        <MilkdownProvider key={id}>
          <EditorWithToolbar initialContent={note.content} onChange={handleContentChange} />
        </MilkdownProvider>
      </div>
      {deleteDialogOpen && (
        <ConfirmDeleteDialog
          message="Delete this note? This cannot be undone."
          anchorRect={deleteAnchorRect}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      )}
    </div>
  )
}
