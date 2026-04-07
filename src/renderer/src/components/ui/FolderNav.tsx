import type { ComponentType, ReactNode } from 'react'
import { ChevronRight, ChevronDown, FolderPlus, Pencil, Trash2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SidebarNavItem({
  id,
  label,
  active,
  route,
  icon: Icon,
  indent = false,
  onDelete,
  deleteTitle = 'Delete',
  onDragStart,
  onDragEnd
}: {
  id: string
  label: string
  active: boolean
  route: string
  icon: ComponentType<{ size: number; className?: string }>
  indent?: boolean
  onDelete: (id: string) => void
  deleteTitle?: string
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => {
        e.dataTransfer.setData('itemId', id)
        onDragStart?.(id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group flex items-center gap-2 mx-1.5 mb-0.5 py-2 rounded-lg transition-all ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''} ${indent ? 'pl-7 pr-2' : 'pl-3 pr-2'} ${
        active
          ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <button
        onClick={() => navigate(route)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <Icon
          size={11}
          className={
            active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'
          }
        />
        <span
          className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}
        >
          {label}
        </span>
      </button>
      <button
        onClick={() => onDelete(id)}
        className="shrink-0 p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        title={deleteTitle}
      >
        <Trash2 size={9} />
      </button>
    </div>
  )
}

interface FolderTreeProps<F extends { id: string; name: string }, I> {
  rootFolders: F[]
  folderChildrenMap: Map<string | undefined, F[]>
  getOrder: (f: F) => number
  getItemsInFolder: (folderId: string) => I[]
  renderItem: (item: I, indent: boolean) => ReactNode
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  onNewItemInFolder: (folderId: string) => void
  // Optional drag-drop
  draggingItemId?: string | null
  dropTarget?: string | 'standalone' | null
  setDropTarget?: (t: string | null) => void
  onDrop?: (folderId: string) => void
  // Optional folder actions (omit to hide those buttons)
  onEditFolder?: (folder: F) => void
  onDeleteFolder?: (id: string) => void
  onNewSubfolder?: (parentId: string) => void
}

export function FolderTree<F extends { id: string; name: string }, I>({
  rootFolders,
  folderChildrenMap,
  getOrder,
  getItemsInFolder,
  renderItem,
  expandedFolders,
  onToggleFolder,
  onNewItemInFolder,
  draggingItemId,
  dropTarget,
  setDropTarget,
  onDrop,
  onEditFolder,
  onDeleteFolder,
  onNewSubfolder
}: FolderTreeProps<F, I>) {
  function renderFolder(folder: F, depth: number): ReactNode {
    const items = getItemsInFolder(folder.id)
    const collapsed = !expandedFolders.has(folder.id)
    const isDropTarget = dropTarget === folder.id
    const children = (folderChildrenMap.get(folder.id) ?? []).sort(
      (a, b) => getOrder(a) - getOrder(b)
    )
    const pl = 16 + depth * 12

    return (
      <div
        key={folder.id}
        onDragOver={(e) => {
          if (draggingItemId) { e.preventDefault(); setDropTarget?.(folder.id) }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget?.(null)
        }}
        onDrop={(e) => { e.preventDefault(); onDrop?.(folder.id) }}
        className={`rounded mx-1 transition-colors ${isDropTarget ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
      >
        <div
          onClick={() => onToggleFolder(folder.id)}
          className="group flex items-center gap-1.5 w-full py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer rounded"
          style={{ paddingLeft: `${pl}px`, paddingRight: '8px' }}
        >
          {collapsed ? (
            <ChevronRight size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
          ) : (
            <ChevronDown size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
          )}
          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wide truncate flex-1 text-left">
            {folder.name}
          </span>
          {onEditFolder && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditFolder(folder) }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
              title="Rename folder"
            >
              <Pencil size={9} />
            </button>
          )}
          {onDeleteFolder && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete folder"
            >
              <Trash2 size={9} />
            </button>
          )}
          {onNewSubfolder && (
            <button
              onClick={(e) => { e.stopPropagation(); onNewSubfolder(folder.id) }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
              title="New subfolder"
            >
              <FolderPlus size={9} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onNewItemInFolder(folder.id) }}
            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
            title="New item in folder"
          >
            <Plus size={10} />
          </button>
        </div>
        {!collapsed && (
          <>
            {children.map((child) => renderFolder(child, depth + 1))}
            {items.map((item) => renderItem(item, true))}
          </>
        )}
      </div>
    )
  }

  return <>{rootFolders.map((f) => renderFolder(f, 0))}</>
}
