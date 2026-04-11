import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, ArrowRight, List, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { TodoList } from '../../types/models'
import ListForm from '../lists/ListForm'
import FolderForm from '../lists/FolderForm'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { FolderTree } from '../ui/FolderNav'
import { useMobileTodosPage } from './hooks/useMobileTodosPage'
import MobilePageHeader from '../ui/MobilePageHeader'

// --- List nav item (mobile: navigate only, no delete) ---

function ListNavItem({
  l,
  active,
  indent = false
}: {
  l: TodoList
  active: boolean
  indent?: boolean
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/lists/${l.id}`)}
      className={`flex items-center gap-2 w-full py-1.5 transition-colors text-left ${indent ? 'pl-8 pr-4' : 'px-4'} ${
        active
          ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.12]'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      <List
        size={20}
        className={
          active ? 'shrink-0 text-[#6498c8]' : 'shrink-0 text-slate-400 dark:text-white/25'
        }
      />
      <span
        className={`text-[13px] truncate flex-1 ${active ? 'font-medium text-[#6498c8]' : 'text-slate-600 dark:text-white/60'}`}
      >
        {l.name}
      </span>
      <ArrowRight size={20} className="shrink-0 text-slate-300 dark:text-white/20" />
    </button>
  )
}

// --- Date hierarchy helpers ---

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

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

function DateSection({
  lists,
  activeListId,
  onNewListForDate
}: {
  lists: TodoList[]
  activeListId?: string
  onNewListForDate: (date: string) => void
}) {
  const tree = useMemo(() => buildDateTree(lists), [lists])
  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  if (years.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
        No date-based lists yet
      </p>
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
              onClick={() =>
                setExpandedYears((prev) => {
                  const next = new Set(prev)
                  next.has(year) ? next.delete(year) : next.add(year)
                  return next
                })
              }
              className="flex items-center gap-1.5 w-full px-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              {yearCollapsed ? (
                <ChevronRight size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-slate-300 dark:text-white/20 shrink-0" />
              )}
              <span className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wide">
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
                      onClick={() =>
                        setExpandedMonths((prev) => {
                          const next = new Set(prev)
                          next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey)
                          return next
                        })
                      }
                      className="flex items-center gap-1.5 w-full pl-6 pr-4 py-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {monthCollapsed ? (
                        <ChevronRight
                          size={20}
                          className="text-slate-300 dark:text-white/20 shrink-0"
                        />
                      ) : (
                        <ChevronDown
                          size={20}
                          className="text-slate-300 dark:text-white/20 shrink-0"
                        />
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30">
                        {monthName}
                      </span>
                    </button>

                    {!monthCollapsed &&
                      days.map((day) => {
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
                                <Plus size={20} />
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
  const {
    folders,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    activeListId,
    expandedFolders,
    toggleFolder,
    openNewList,
    listFormOpen,
    editingList,
    newListDefaultDate,
    newListFolderId,
    handleSaveList,
    closeListForm,
    folderFormOpen,
    editingFolder,
    openFolderForm,
    handleSaveFolder,
    closeFolderForm
  } = useMobileTodosPage()

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-app)]">
        {/* Header */}
        <MobilePageHeader title="Lists" />

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
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={openFolderForm}
                    className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                    title="New folder"
                  >
                    <FolderOpen size={20} />
                  </button>
                </div>
              }
            >
              {adHocLists.length === 0 && folders.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">
                  No lists yet
                </p>
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
                expandedFolders={expandedFolders}
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
                >
                  <Plus size={20} />
                </button>
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
          onSave={handleSaveList}
          onClose={closeListForm}
        />
      )}

      {folderFormOpen && (
        <FolderForm folder={editingFolder} onSave={handleSaveFolder} onClose={closeFolderForm} />
      )}
    </>
  )
}
