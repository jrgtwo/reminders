import { forwardRef, useImperativeHandle } from 'react'
import { Plus, FolderOpen, List, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { TodoList } from '../../types/models'
import FolderForm from './FolderForm'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { MoreMenu } from '../ui/MoreMenu'
import { useListsNav } from './hooks/useListsNav'

export interface ListsNavHandle {
  openNewList: () => void
}

const ListsNav = forwardRef<ListsNavHandle>(function ListsNav(_, ref) {
  const navigateTo = useNavigate()
  const {
    folders,
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap,
    rootFolders,
    expandedFolders,
    folderFormOpen,
    editingFolder,
    activeListId,
    toggleFolder,
    openNewList,
    handleDeleteList,
    handleDeleteFolder,
    openFolderForm,
    closeFolderForm,
    handleSaveFolder,
    draggingListId,
    setDraggingListId,
    listDropTarget,
    setListDropTarget,
    draggingFolderId,
    setDraggingFolderId,
    handleListDrop,
    handleFolderDrop,
    listDelete,
    folderDelete,
  } = useListsNav()

  useImperativeHandle(ref, () => ({ openNewList: () => openNewList() }))

  function renderList(l: TodoList, indent: boolean) {
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
      {/* My Lists */}
      <CollapsibleSection
          label="My Lists"
          count={adHocLists.length}
          accent="slate"
          defaultOpen={true}
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
            <>
              <button
                onClick={() => navigateTo('/browse')}
                className="p-1 rounded text-slate-300 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                title="Browse all"
              >
                <Maximize2 size={16} />
              </button>
              <MoreMenu
                items={[
                  { label: 'New list', icon: Plus, onClick: () => openNewList() },
                  { label: 'New folder', icon: FolderOpen, onClick: () => openFolderForm(null) },
                ]}
              />
            </>
          }
        >

          {adHocLists.length === 0 && folders.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-white/50 px-4 py-2">No lists yet</p>
          )}

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
            onNewItemInFolder={(folderId) => openNewList({ folderId })}
            onEditFolder={(folder) => openFolderForm(folder)}
            onDeleteFolder={handleDeleteFolder}
          />

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
        </CollapsibleSection>

        {/* By Date */}
        {dateLists.length > 0 && (
          <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
            <CollapsibleSection
              label="By Date"
              count={dateLists.length}
              accent="slate"
              defaultOpen={false}
              headerExtra={
                <MoreMenu
                  items={[
                    { label: 'New list', icon: Plus, onClick: () => openNewList() },
                  ]}
                />
              }
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

      {folderFormOpen && (
        <FolderForm
          folder={editingFolder}
          onSave={handleSaveFolder}
          onClose={closeFolderForm}
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
})

export default ListsNav
