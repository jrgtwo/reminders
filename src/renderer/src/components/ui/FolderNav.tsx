import type { ComponentType, ReactNode } from 'react'
import { ChevronRight, ChevronDown, FolderPlus, Pencil, Trash2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDateTree } from './hooks/useDateTree'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export function DateTree<I>({
  items,
  getDate,
  renderItem,
  onNewForDate,
  emptyMessage = 'No items yet',
  newItemTitle = 'New item'
}: {
  items: I[]
  getDate: (item: I) => string | undefined
  renderItem: (item: I) => ReactNode
  onNewForDate: (date: string) => void
  emptyMessage?: string
  newItemTitle?: string
}) {
  const { tree, years, expandedYears, expandedMonths, expandedDays, toggleYear, toggleMonth, toggleDay } =
    useDateTree(items, getDate)

  if (years.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">{emptyMessage}</p>
    )
  }

  return (
    <>
      {years.map((year) => {
        const yearCollapsed = !expandedYears.has(year)
        const months = Object.keys(tree[year]).sort((a, b) => b.localeCompare(a))
        return (
          <div key={year}>
            <button
              onClick={() => toggleYear(year)}
              className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              {yearCollapsed ? (
                <ChevronRight size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
              )}
              <span className="text-[15px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wide">
                {year}
              </span>
            </button>

            {!yearCollapsed &&
              months.map((month) => {
                const monthKey = `${year}-${month}`
                const monthCollapsed = !expandedMonths.has(monthKey)
                const days = Object.keys(tree[year][month]).sort((a, b) => b.localeCompare(a))
                const monthName = MONTH_NAMES[parseInt(month, 10) - 1]
                return (
                  <div key={month}>
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="flex items-center gap-1.5 w-full pl-6 pr-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {monthCollapsed ? (
                        <ChevronRight size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
                      )}
                      <span className="text-[15px] font-semibold text-slate-400 dark:text-white/30">
                        {monthName}
                      </span>
                    </button>

                    {!monthCollapsed &&
                      days.map((day) => {
                        const dayItems = tree[year][month][day]
                        const dateStr = `${year}-${month}-${day}`
                        const dayCollapsed = !expandedDays.has(dateStr)
                        return (
                          <div key={day}>
                            <div className="flex items-center pl-8 pr-4 py-0.5">
                              <button
                                onClick={() => toggleDay(dateStr)}
                                className="flex items-center gap-1.5 flex-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                              >
                                {dayCollapsed ? (
                                  <ChevronRight size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
                                ) : (
                                  <ChevronDown size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
                                )}
                                <span className="text-[15px] font-semibold text-slate-400 dark:text-white/25">
                                  {ordinal(parseInt(day, 10))}
                                </span>
                              </button>
                              <button
                                onClick={() => onNewForDate(dateStr)}
                                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                                title={`${newItemTitle} for ${dateStr}`}
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                            {!dayCollapsed && dayItems.map((item, i) => (
                              <div key={i}>{renderItem(item)}</div>
                            ))}
                          </div>
                        )
                      })}
                  </div>
                )
              })}
          </div>
        )
      })}
    </>
  )
}

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
  onDelete: (id: string, e: React.MouseEvent) => void
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
      className={`group relative flex items-center gap-2 mx-1.5 mb-0.5 py-2 rounded-lg transition-all ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''} ${indent ? 'pl-7 pr-2' : 'pl-3 pr-2'} ${
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
          size={20}
          className={
            active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'
          }
        />
        <span
          className={`text-[15px] truncate flex-1 pr-6 md:pr-0 md:group-hover:pr-6 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}
        >
          {label}
        </span>
      </button>
      <button
        onClick={(e) => onDelete(id, e)}
        className="absolute right-1 p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
        title={deleteTitle}
      >
        <Trash2 size={20} />
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
  onDeleteFolder?: (id: string, e: React.MouseEvent) => void
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
          className="group relative flex items-center gap-1.5 w-full py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer rounded"
          style={{ paddingLeft: `${pl}px`, paddingRight: '8px' }}
        >
          {collapsed ? (
            <ChevronRight size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
          ) : (
            <ChevronDown size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
          )}
          <span className="text-[15px] font-semibold text-slate-400 dark:text-white/30 truncate flex-1 text-left pr-20 md:pr-0 md:group-hover:pr-20">
            {folder.name}
          </span>
          <div className="absolute right-1 flex items-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onEditFolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditFolder(folder) }}
                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                title="Rename folder"
              >
                <Pencil size={20} />
              </button>
            )}
            {onDeleteFolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id, e) }}
                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
                title="Delete folder"
              >
                <Trash2 size={20} />
              </button>
            )}
            {onNewSubfolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onNewSubfolder(folder.id) }}
                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                title="New subfolder"
              >
                <FolderPlus size={20} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onNewItemInFolder(folder.id) }}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New item in folder"
            >
              <Plus size={20} />
            </button>
          </div>
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
