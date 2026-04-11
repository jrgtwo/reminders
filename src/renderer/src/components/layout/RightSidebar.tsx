import type { ReactNode } from 'react'
import {
  CheckSquare,
  Plus,
  List,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react'
import type { TodoList } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'
import NotesNav from '../notes/NotesNav'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { useRightSidebar, formatOverdueDate, formatUpcomingDate } from './hooks/useRightSidebar'
import SidebarAddButton from '../ui/SidebarAddButton'
import SidebarHeader from '../ui/SidebarHeader'

export default function RightSidebar() {
  const {
    navigate,
    rightOpen,
    setRightOpen,
    folders,
    lists,
    asideRef,
    width,
    onResizeStart,
    folderFormOpen,
    editingFolder,
    pendingParentFolderId,
    listFormOpen,
    editingList,
    newListFolderId,
    newListDueDate,
    expandedFolders,
    draggingListId,
    setDraggingListId,
    listDropTarget,
    setListDropTarget,
    overdueReminders,
    upcomingReminders,
    overdueYesterday,
    overdueThisWeek,
    overdueOlder,
    upcomingToday,
    upcomingThisWeek,
    upcomingLater,
    activeListId,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    listCount,
    toggleFolder,
    openNewList,
    handleDeleteFolder,
    handleListDrop,
    handleDeleteList,
    openFolderForm,
    closeFolderForm,
    handleSaveFolder,
    handleSaveListForm,
    closeListForm,
    listDelete,
    folderDelete,
  } = useRightSidebar()

  function ReminderItem({
    id,
    dateStr,
    title,
    time,
    variant
  }: {
    id: string
    dateStr: string
    title: string
    time?: string
    variant: 'overdue' | 'upcoming'
  }) {
    return (
      <li key={`${id}-${dateStr}`}>
        <button
          onClick={() => navigate(`/day/${dateStr}`, { state: { tab: 'reminders' } })}
          className={`w-full text-left px-3 py-2 rounded-xl transition-all group ${
            variant === 'overdue'
              ? 'bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-[#e8a045]/[0.08] hover:shadow-sm'
              : 'bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:shadow-sm'
          }`}
        >
          <div
            className={`text-[11px] font-semibold mb-0.5 ${variant === 'overdue' ? 'text-red-400 dark:text-[#e8a045]/80' : 'text-blue-500 dark:text-[#6498c8]/80'}`}
          >
            {variant === 'overdue' ? formatOverdueDate(dateStr) : formatUpcomingDate(dateStr)}
          </div>
          <div className="text-[12px] font-medium text-slate-700 dark:text-white/75 truncate group-hover:text-slate-900 dark:group-hover:text-[#f0f0f0]">
            {title}
          </div>
          {time && (
            <div className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{time}</div>
          )}
        </button>
      </li>
    )
  }

  function renderList(l: TodoList, indent: boolean): ReactNode {
    return (
      <SidebarNavItem
        key={l.id}
        id={l.id}
        label={l.name}
        active={activeListId === l.id}
        route={`/lists/${l.id}`}
        icon={List}
        indent={indent}
        onDelete={handleDeleteList}
        deleteTitle="Delete list"
        onDragStart={setDraggingListId}
        onDragEnd={() => { setDraggingListId(null); setListDropTarget(null) }}
      />
    )
  }

  return (
    <>
      <aside
        ref={asideRef}
        className="relative h-full flex flex-col border-l border-slate-300/60 dark:border-white/[0.07] overflow-hidden bg-[var(--bg-app)] transition-[width] duration-200"
        style={{ width: rightOpen ? width : 44 }}
      >
        {/* Header */}
        <SidebarHeader
          title="Tasks & Notes"
          collapsed={!rightOpen}
          onToggle={() => setRightOpen(!rightOpen)}
          side="right"
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {rightOpen && (
            <>
              {/* Reminders section */}
              <div className="py-1">
                <CollapsibleSection
                  label="Reminders"
                  count={overdueReminders.length + upcomingReminders.length}
                  accent="blue"
                  defaultOpen
                  headerExtra={
                    <button
                      onClick={() => navigate('/reminders')}
                      className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                      title="Go to Reminders"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  }
                >
                  {overdueReminders.length === 0 && upcomingReminders.length === 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2 text-center">
                      No upcoming reminders
                    </p>
                  )}
                  {overdueReminders.length > 0 && (
                    <CollapsibleSection
                      label="Overdue"
                      count={overdueReminders.length}
                      accent="red"
                      defaultOpen={false}
                    >
                      <div className="flex flex-col gap-0.5">
                        {overdueYesterday.length > 0 && (
                          <CollapsibleSection
                            label="Yesterday"
                            count={overdueYesterday.length}
                            accent="red"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueYesterday.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {overdueThisWeek.length > 0 && (
                          <CollapsibleSection
                            label="This Week"
                            count={overdueThisWeek.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueThisWeek.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {overdueOlder.length > 0 && (
                          <CollapsibleSection
                            label="Older"
                            count={overdueOlder.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {overdueOlder.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="overdue"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                  {upcomingReminders.length > 0 && (
                    <CollapsibleSection
                      label="Upcoming"
                      count={upcomingReminders.length}
                      accent="blue"
                      defaultOpen={false}
                    >
                      <div className="flex flex-col gap-0.5">
                        {upcomingToday.length > 0 && (
                          <CollapsibleSection
                            label="Today"
                            count={upcomingToday.length}
                            accent="blue"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingToday.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {upcomingThisWeek.length > 0 && (
                          <CollapsibleSection
                            label="This Week"
                            count={upcomingThisWeek.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingThisWeek.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                        {upcomingLater.length > 0 && (
                          <CollapsibleSection
                            label="Later"
                            count={upcomingLater.length}
                            accent="slate"
                            defaultOpen
                          >
                            <ul className="flex flex-col gap-1 px-2 pb-1">
                              {upcomingLater.map((item, i) => (
                                <ReminderItem
                                  key={`${item.id}-${item.dateStr}-${i}`}
                                  {...item}
                                  variant="upcoming"
                                />
                              ))}
                            </ul>
                          </CollapsibleSection>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}
                </CollapsibleSection>
              </div>

              {/* Notes section */}
              <div className="py-1 border-t-2 border-slate-200 dark:border-white/[0.1] mt-1">
                <CollapsibleSection
                  label="Notes"
                  count={0}
                  accent="blue"
                  defaultOpen
                  headerExtra={
                    <button
                      onClick={() => navigate('/notes')}
                      className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                      title="Go to Notes"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  }
                >
                  <NotesNav />
                </CollapsibleSection>
              </div>

              {/* Lists section */}
              <div className="py-1 border-t-2 border-slate-200 dark:border-white/[0.1] mt-1">
                <CollapsibleSection
                  label="Lists"
                  count={lists.length}
                  accent="blue"
                  defaultOpen
                  headerExtra={
                    <button
                      onClick={() => navigate('/todos')}
                      className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                      title="Go to Lists"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  }
                >
                  {/* My Lists */}
                  <CollapsibleSection
                    label="My Lists"
                    count={adHocLists.length}
                    accent="slate"
                    defaultOpen={false}
                    headerExtra={
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => openNewList()}
                          className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                          title="New list"
                        >
                          <Plus size={20} />
                        </button>
                        <button
                          onClick={() => openFolderForm(null)}
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
                    <div
                      onDragOver={(e) => { if (draggingListId) { e.preventDefault(); setListDropTarget('standalone') } }}
                      onDragLeave={() => setListDropTarget(null)}
                      onDrop={(e) => { e.preventDefault(); handleListDrop(undefined) }}
                      className={`transition-colors rounded mx-1 ${listDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
                    >
                      {standaloneLists.map((l) => renderList(l, false))}
                      {listDropTarget === 'standalone' && standaloneLists.length === 0 && (
                        <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">Drop here to remove from folder</p>
                      )}
                    </div>
                    <FolderTree
                      rootFolders={rootFolders}
                      folderChildrenMap={folderChildrenMap}
                      getOrder={(f) => f.order}
                      getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
                      renderItem={renderList}
                      draggingItemId={draggingListId}
                      dropTarget={listDropTarget}
                      setDropTarget={setListDropTarget}
                      onDrop={handleListDrop}
                      expandedFolders={expandedFolders}
                      onToggleFolder={toggleFolder}
                      onEditFolder={(folder) => openFolderForm(folder)}
                      onDeleteFolder={handleDeleteFolder}
                      onNewSubfolder={(parentId) => openFolderForm(null, parentId)}
                      onNewItemInFolder={(folderId) => openNewList({ folderId })}
                    />
                  </CollapsibleSection>

                  {/* By Date */}
                  {dateLists.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
                      <CollapsibleSection
                        label="By Date"
                        count={dateLists.length}
                        accent="slate"
                        defaultOpen={false}
                      >
                        <DateTree
                          items={dateLists}
                          getDate={(l) => l.dueDate}
                          renderItem={(l) => (
                            <SidebarNavItem
                              id={l.id}
                              label={l.name}
                              active={activeListId === l.id}
                              route={`/lists/${l.id}`}
                              icon={List}
                              indent
                              onDelete={handleDeleteList}
                              deleteTitle="Delete list"
                            />
                          )}
                          onNewForDate={(date) => openNewList({ dueDate: date })}
                          emptyMessage="No date-based lists yet"
                          newItemTitle="New list"
                        />
                      </CollapsibleSection>
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            </>
          )}

          {!rightOpen && (
            <div className="flex flex-col items-center pt-3">
              <CheckSquare size={20} className="text-slate-300 dark:text-white/20" />
              {listCount > 0 && (
                <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-2">
                  {listCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        {rightOpen && (
          <div
            onMouseDown={onResizeStart}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors"
          />
        )}

        {/* Bottom */}
        {rightOpen && (
          <SidebarAddButton label="New List" onClick={() => openNewList()} />
        )}
      </aside>

      {folderFormOpen && (
        <FolderForm
          folder={editingFolder}
          parentId={pendingParentFolderId}
          onSave={handleSaveFolder}
          onClose={closeFolderForm}
        />
      )}

      {listFormOpen && (
        <ListForm
          list={editingList}
          folders={folders}
          defaultFolderId={newListFolderId}
          defaultDueDate={newListDueDate}
          onSave={handleSaveListForm}
          onClose={closeListForm}
        />
      )}

      {listDelete.pendingId && (
        <ConfirmDeleteDialog
          message={listDelete.pendingMessage}
          anchorRect={listDelete.anchorRect}
          onConfirm={listDelete.confirmDelete}
          onCancel={listDelete.cancelDelete}
        />
      )}

      {folderDelete.pendingId && (
        <ConfirmDeleteDialog
          message={folderDelete.pendingMessage}
          anchorRect={folderDelete.anchorRect}
          onConfirm={folderDelete.confirmDelete}
          onCancel={folderDelete.cancelDelete}
        />
      )}
    </>
  )
}
