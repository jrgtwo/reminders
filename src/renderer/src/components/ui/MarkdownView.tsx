import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'

function ReadOnlyEditor({ content }: { content: string }) {
  useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, content)
        ctx.update(editorViewOptionsCtx, (prev) => ({ ...prev, editable: () => false }))
      })
      .use(commonmark)
      .use(gfm),
  )

  return (
    <div
      className="
        text-xs text-gray-600 dark:text-gray-400
        [&_.milkdown]:outline-none
        [&_.ProseMirror]:outline-none
        [&_.ProseMirror_p]:mb-1 [&_.ProseMirror_p:last-child]:mb-0
        [&_.ProseMirror_h1]:text-sm [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-1
        [&_.ProseMirror_h2]:text-sm [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-1
        [&_.ProseMirror_h3]:text-xs [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-1
        [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ul]:mb-1
        [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_ol]:mb-1
        [&_.ProseMirror_li]:mb-0
        [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:dark:border-[var(--border)] [&_.ProseMirror_blockquote]:pl-2 [&_.ProseMirror_blockquote]:italic
        [&_.ProseMirror_code]:bg-gray-200 [&_.ProseMirror_code]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono
        [&_.ProseMirror_pre]:bg-gray-200 [&_.ProseMirror_pre]:dark:bg-[var(--bg-elevated)] [&_.ProseMirror_pre]:p-2 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:mb-1 [&_.ProseMirror_pre]:overflow-x-auto
        [&_.ProseMirror_a]:text-[var(--accent)] [&_.ProseMirror_a]:underline
        [&_.ProseMirror_strong]:font-semibold
        [&_.ProseMirror_em]:italic
        [&_.ProseMirror_s]:line-through
      "
    >
      <Milkdown />
    </div>
  )
}

interface Props {
  content: string
}

export default function MarkdownView({ content }: Props) {
  return (
    <MilkdownProvider>
      <ReadOnlyEditor content={content} />
    </MilkdownProvider>
  )
}
