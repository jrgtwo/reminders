import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, ArrowRight, List, FolderOpen } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTodoFoldersStore } from '../../store/todo_folders.store'
import { useTodoListsStore } from '../../store/todo_lists.store'
import { buildFolderTree } from '../../lib/folderTree'
import type { TodoFolder, TodoList } from '../../types/models'
import ListForm from '../lists/ListForm'
import FolderForm from '../lists/FolderForm'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { FolderTree } from '../ui/FolderNav'

// --- List nav item (mobile: navigate only, no delete) ---

function ListNavItem({ l, active, indent = false }: { l: TodoList; active: boolean; indent?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/lists/${l.id}`)}
      className={`flex items-center gap-2 w-full py-1.5 transition-colors text-left ${indent ? 'pl-8 pr-4' : 'px-4'} ${
        active ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <List size={11} className={active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'} />
      <span className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}>
        {l.name}
      </span>
      <ArrowRight size={11} className="shrink-0 text-slate-300 dark:text-white/20" />
    </button>
  )
}

// --- Date hierarchy helpers ---

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

type DayMap = Record<string, TodoList[]>
type MonthMap = Record<string, DayMap>
type YearMap = Record<string, MonthMap>

function buildDateTree(lists: TodoList[]): YearMap {
  const tree: YearMap = {}
  for (const l of lists) {
    if (!l.dueDate) continue
    const [year, month, day] = l.dueDate.split('-')
    if (!tree[year]) tree[year] = {}
    if (!tree[year][month]) tree[year][month] = {}
    if (!tree[year][month][day]) tree[year][month][day] = []
    tree[year][month][day].push(l)
  }
  return tree
}

function DateSection({ lists, activeListId, onNewListForDate }: {
  lists: TodoList[]
  activeListId?: string
  onNewListForDate: (date: string) => void
}) {
  const tree = useMemo(() => buildDateTree(lists), [lists])
  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set())
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  if (years.length === 0) {
    return <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No date-based lists yet</p>
  }

  return (
    <>
      {years.map((year) => {
        const yearCollapsed = collapsedYears.has(year)
        const months = Object.keys(tree[year]).sort((a, b) => b.localeCompare(a))
        return (
          <div key={year}>
            <button
              onClick={() => setCollapsedYears((prev) => {
                const next = new Set(prev)
                next.has(year) ? next.delete(year) : next.add(year)
                return next
              })}
              className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              {yearCollapsed
                ? <ChevronRight size={10} className="text-slate-300 dark:text-white/20 shrink-0" />
                : <ChevronDown size={10} className="text-slate-300 dark:text-white/20 shrink-0" />}
              <span className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wide">{year}</span>
            </button>

            {!yearCollapsed && months.map((month) => {
              const monthKey = `${year}-${month}`
              const monthCollapsed = collapsedMonths.has(monthKey)
              const days = Object.keys(tree[year][month]).sort((a, b) => b.localeCompare(a))
              const monthName = MONTH_NAMES[parseInt(month, 10) - 1]

              return (
                <div key={month}>
                  <button
                    onClick={() => setCollapsedMonths((prev) => {
                      const next = new Set(prev)
                      next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey)
                      return next
                    })}
                    className="flex items-center gap-1.5 w-full pl-6 pr-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {monthCollapsed
                      ? <ChevronRight size={9} className="text-slate-300 dark:text-white/20 shrink-0" />
                      : <ChevronDown size={9} className="text-slate-300 dark:text-white/20 shrink-0" />}
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30">{monthName}</span>
                  </button>

                  {!monthCollapsed && days.map((day) => {
                    const dayLists = tree[year][month][day]
                    const dateStr = `${year}-${month}-${day}`
                    return (
                      <div key={day}>
                        <div className="flex items-center pl-10 pr-4 py-0.5">
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/25 flex-1">
                            {parseInt(day, 10)}
                          </span>
                          <button
                            onClick={() => onNewListForDate(dateStr)}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                            title={`New list for ${dateStr}`}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        {dayLists.map((l) => (
                          <ListNavItem key={l.id} l={l} active={activeListId === l.id} indent />
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

// --- Main component ---

export default function TodosPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const folders = useTodoFoldersStore((s) => s.folders)
  const loadFolders = useTodoFoldersStore((s) => s.load)
  const saveFolder = useTodoFoldersStore((s) => s.save)

  const lists = useTodoListsStore((s) => s.lists)
  const loadLists = useTodoListsStore((s) => s.load)
  const saveList = useTodoListsStore((s) => s.save)

  const [listFormOpen, setListFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<TodoList | null>(null)
  const [newListDefaultDate, setNewListDefaultDate] = useState<string | undefined>()
  const [newListFolderId, setNewListFolderId] = useState<string | undefined>()
  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<TodoFolder | null>(null)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadLists()
    loadFolders()
  }, [loadLists, loadFolders])

  const activeListId = location.pathname.startsWith('/lists/')
    ? location.pathname.slice('/lists/'.length)
    : undefined

  const adHocLists = useMemo(
    () => lists.filter((l) => !l.dueDate).sort((a, b) => a.order - b.order),
    [lists]
  )
  const dateLists = useMemo(
    () => lists.filter((l) => !!l.dueDate),
    [lists]
  )
  const standaloneLists = useMemo(
    () => adHocLists.filter((l) => !l.folderId),
    [adHocLists]
  )
  const folderChildrenMap = useMemo(() => buildFolderTree(folders), [folders])
  const rootFolders = useMemo(
    () => (folderChildrenMap.get(undefined) ?? []).sort((a, b) => a.order - b.order),
    [folderChildrenMap]
  )

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openNewList(opts: { folderId?: string; dueDate?: string } = {}) {
    setEditingList(null)
    setNewListDefaultDate(opts.dueDate)
    setNewListFolderId(opts.folderId)
    setListFormOpen(true)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-app)]">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-black/10 dark:border-white/[0.07]">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 flex-1">Lists</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Ad-hoc section */}
          <div className="py-1">
            <CollapsibleSection
              label="My Lists"
              count={adHocLists.length}
              defaultOpen={true}
              headerExtra={
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => openNewList()}
                    className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                    title="New list"
                  ><Plus size={11} /></button>
                  <button
                    onClick={() => { setEditingFolder(null); setFolderFormOpen(true) }}
                    className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                    title="New folder"
                  ><FolderOpen size={11} /></button>
                </div>
              }
            >
              {adHocLists.length === 0 && folders.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No lists yet</p>
              )}

              {standaloneLists.map((l) => (
                <ListNavItem key={l.id} l={l} active={activeListId === l.id} />
              ))}

              <FolderTree
                rootFolders={rootFolders}
                folderChildrenMap={folderChildrenMap}
                getOrder={(f) => f.order}
                getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
                renderItem={(l, indent) => (
                  <ListNavItem key={l.id} l={l} active={activeListId === l.id} indent={indent} />
                )}
                collapsedFolders={collapsedFolders}
                onToggleFolder={toggleFolder}
                onNewItemInFolder={(folderId) => openNewList({ folderId })}
              />
            </CollapsibleSection>
          </div>

          {/* Date-based section */}
          <div className="border-t border-slate-200 dark:border-white/[0.07] pt-1 pb-2">
            <CollapsibleSection
              label="By Date"
              count={dateLists.length}
              accent="slate"
              defaultOpen={true}
              headerExtra={
                <button
                  onClick={() => openNewList()}
                  className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                  title="New date-based list"
                ><Plus size={11} /></button>
              }
            >
              <DateSection
                lists={dateLists}
                activeListId={activeListId}
                onNewListForDate={(date) => openNewList({ dueDate: date })}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {listFormOpen && (
        <ListForm
          list={editingList}
          folders={folders}
          defaultFolderId={newListFolderId}
          defaultDueDate={newListDefaultDate}
          onSave={async (l) => {
            await saveList(l)
            setListFormOpen(false)
            setEditingList(null)
            navigate(`/lists/${l.id}`)
          }}
          onClose={() => { setListFormOpen(false); setEditingList(null) }}
        />
      )}

      {folderFormOpen && (
        <FolderForm
          folder={editingFolder}
          onSave={async (f) => { await saveFolder(f); setFolderFormOpen(false); setEditingFolder(null) }}
          onClose={() => { setFolderFormOpen(false); setEditingFolder(null) }}
        />
      )}
    </>
  )
}
