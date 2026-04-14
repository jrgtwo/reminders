import type { ReactNode } from 'react'
import {
  CheckSquare,
  Plus,
  List,
  FolderOpen,
  ArrowUpRight,
} from 'lucide-react'
import type { TodoList } from '../../types/models'
import FolderForm from '../lists/FolderForm'
import ListForm from '../lists/ListForm'
import NotesNav from '../notes/NotesNav'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { MoreMenu } from '../ui/MoreMenu'
import { useRightSidebar } from './hooks/useRightSidebar'
import SidebarAddButton from '../ui/SidebarAddButton'
import SidebarHeader from '../ui/SidebarHeader'
import RemindersSidebarSection from './RemindersSidebarSection'

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
    draggingFolderId,
    setDraggingFolderId,
    handleFolderDrop,
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
        className="relative h-full flex flex-col border-l border-slate-300/60 dark:border-white/[0.07] overflow-hidden bg-[var(--bg-app)] transition-[width] duration-200 paper"
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
              <RemindersSidebarSection
                overdueReminders={overdueReminders}
                upcomingReminders={upcomingReminders}
                overdueYesterday={overdueYesterday}
                overdueThisWeek={overdueThisWeek}
                overdueOlder={overdueOlder}
                upcomingToday={upcomingToday}
                upcomingThisWeek={upcomingThisWeek}
                upcomingLater={upcomingLater}
              />

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
                      className="p-1 rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
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
                      className="p-1 rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
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
                    onHeaderDragOver={(e) => {
                      if (draggingListId || draggingFolderId) {
                        e.preventDefault()
                        e.stopPropagation()
                        setListDropTarget('standalone')
                      }
                    }}
                    onHeaderDragLeave={() => setListDropTarget(null)}
                    onHeaderDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (draggingFolderId) handleFolderDrop(undefined)
                      else handleListDrop(undefined)
                    }}
                    isHeaderDropTarget={listDropTarget === 'standalone' && !!(draggingListId || draggingFolderId)}
                    headerExtra={
                      <MoreMenu
                        items={[
                          { label: 'New list', icon: Plus, onClick: () => openNewList() },
                          { label: 'New folder', icon: FolderOpen, onClick: () => openFolderForm(null) },
                        ]}
                      />
                    }
                  >
                    {adHocLists.length === 0 && folders.length === 0 && (
                      <p className="text-[11px] text-slate-400 dark:text-white/50 px-4 py-2">
                        No lists yet
                      </p>
                    )}
                    <div
                      onDragOver={(e) => {
                        if (draggingListId || draggingFolderId) { e.preventDefault(); setListDropTarget('standalone') }
                      }}
                      onDragLeave={() => setListDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggingFolderId) handleFolderDrop(undefined)
                        else handleListDrop(undefined)
                      }}
                      className={`transition-colors rounded mx-1 ${listDropTarget === 'standalone' ? 'bg-[var(--accent)]/10 dark:bg-[var(--accent)]/[0.08] ring-1 ring-[var(--accent)]/30' : ''}`}
                    >
                      {standaloneLists.map((l) => renderList(l, false))}
                      {listDropTarget === 'standalone' && standaloneLists.length === 0 && draggingListId && (
                        <p className="text-[11px] text-[var(--accent)]/60 px-4 py-2">Drop here to remove from folder</p>
                      )}
                      {listDropTarget === 'standalone' && draggingFolderId && (
                        <p className="text-[11px] text-[var(--accent)]/60 px-4 py-2">Drop here to move to top level</p>
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
                      draggingFolderId={draggingFolderId}
                      onFolderDragStart={setDraggingFolderId}
                      onFolderDragEnd={() => { setDraggingFolderId(null); setListDropTarget(null) }}
                      onFolderDrop={handleFolderDrop}
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
              <CheckSquare size={20} className="text-slate-300 dark:text-white/50" />
              {listCount > 0 && (
                <span className="text-[11px] font-bold text-[var(--accent)] mt-2">
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
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)]/30 transition-colors"
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
