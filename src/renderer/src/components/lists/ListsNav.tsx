import { forwardRef, useImperativeHandle } from 'react'
import { Plus, FolderOpen, List } from 'lucide-react'
import type { TodoList } from '../../types/models'
import FolderForm from './FolderForm'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { useListsNav } from './hooks/useListsNav'

export interface ListsNavHandle {
  openNewList: () => void
}

const ListsNav = forwardRef<ListsNavHandle>(function ListsNav(_, ref) {
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
            <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No lists yet</p>
          )}

          <FolderTree
            rootFolders={rootFolders}
            folderChildrenMap={folderChildrenMap}
            getOrder={(f) => f.order}
            getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
            renderItem={renderList}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onNewItemInFolder={(folderId) => openNewList({ folderId })}
            onEditFolder={(folder) => openFolderForm(folder)}
            onDeleteFolder={handleDeleteFolder}
          />

          {standaloneLists.map((l) => renderList(l, false))}
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
                <button
                  onClick={() => openNewList()}
                  className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                  title="New date-based list"
                >
                  <Plus size={20} />
                </button>
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
