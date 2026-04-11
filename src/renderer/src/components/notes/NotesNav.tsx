import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'
import { Plus, FolderOpen, FileText, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Note } from '../../types/models'
import NoteFolderForm from './NoteFolderForm'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { MoreMenu } from '../ui/MoreMenu'
import { useNotesNav } from './hooks/useNotesNav'

export interface NotesNavHandle {
  openNewNote: () => void
}

const NotesNav = forwardRef<NotesNavHandle>(function NotesNav(_, ref) {
  const navigateTo = useNavigate()
  const {
    allNotes,
    noteFolders,
    noteCount,
    standaloneNotes,
    dateNotes,
    noteFolderChildrenMap,
    rootNoteFolders,
    expandedNoteFolders,
    draggingNoteId,
    setDraggingNoteId,
    noteDropTarget,
    setNoteDropTarget,
    draggingNoteFolderId,
    setDraggingNoteFolderId,
    handleNoteFolderDrop,
    noteFolderFormOpen,
    editingNoteFolder,
    pendingParentNoteFolderId,
    activeNoteId,
    toggleNoteFolder,
    handleNewNote,
    handleNewNoteForDate,
    handleDeleteNote,
    handleDeleteNoteFolder,
    handleNoteDrop,
    openNoteFolderForm,
    closeNoteFolderForm,
    handleSaveNoteFolder,
    noteDelete,
    folderDelete,
  } = useNotesNav()

  useImperativeHandle(ref, () => ({ openNewNote: () => handleNewNote(undefined) }))

  function renderNote(n: Note, indent: boolean): ReactNode {
    return (
      <SidebarNavItem
        key={n.id}
        id={n.id}
        label={n.title || 'Untitled'}
        active={activeNoteId === n.id}
        route={`/notes/${n.id}`}
        icon={FileText}
        indent={indent}
        onDelete={handleDeleteNote}
        deleteTitle="Delete note"
        onDragStart={setDraggingNoteId}
        onDragEnd={() => {
          setDraggingNoteId(null)
          setNoteDropTarget(null)
        }}
      />
    )
  }

  return (
    <>
      {noteCount === 0 && noteFolders.length === 0 && (
        <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No notes yet</p>
      )}

      {/* My Notes Collapsible Section */}
      <CollapsibleSection
          label="My Notes"
          count={standaloneNotes.length + rootNoteFolders.length}
          accent="slate"
          defaultOpen={false}
          onHeaderDragOver={(e) => {
            if (draggingNoteId || draggingNoteFolderId) {
              e.preventDefault()
              e.stopPropagation()
              setNoteDropTarget('standalone')
            }
          }}
          onHeaderDragLeave={() => setNoteDropTarget(null)}
          onHeaderDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (draggingNoteFolderId) handleNoteFolderDrop(undefined)
            else handleNoteDrop(undefined)
          }}
          isHeaderDropTarget={noteDropTarget === 'standalone' && !!(draggingNoteId || draggingNoteFolderId)}
          headerExtra={
            <>
              <button
                onClick={() => navigateTo('/browse')}
                className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                title="Browse all"
              >
                <Maximize2 size={16} />
              </button>
              <MoreMenu
                items={[
                  { label: 'New note', icon: Plus, onClick: () => handleNewNote(undefined) },
                  {
                    label: 'New folder',
                    icon: FolderOpen,
                    onClick: () => openNoteFolderForm(null, undefined),
                  },
                ]}
              />
            </>
          }
        >
          <FolderTree
            rootFolders={rootNoteFolders}
            folderChildrenMap={noteFolderChildrenMap}
            getOrder={(f) => f.displayOrder}
            getItemsInFolder={(folderId) =>
              Array.from(allNotes.values()).filter((n) => n.folderId === folderId)
            }
            renderItem={renderNote}
            draggingItemId={draggingNoteId}
            dropTarget={noteDropTarget}
            setDropTarget={setNoteDropTarget}
            onDrop={handleNoteDrop}
            draggingFolderId={draggingNoteFolderId}
            onFolderDragStart={setDraggingNoteFolderId}
            onFolderDragEnd={() => { setDraggingNoteFolderId(null); setNoteDropTarget(null) }}
            onFolderDrop={handleNoteFolderDrop}
            expandedFolders={expandedNoteFolders}
            onToggleFolder={toggleNoteFolder}
            onEditFolder={(folder) => openNoteFolderForm(folder)}
            onDeleteFolder={handleDeleteNoteFolder}
            onNewSubfolder={(parentId) => openNoteFolderForm(null, parentId)}
            onNewItemInFolder={handleNewNote}
          />

          <div
            onDragOver={(e) => {
              if (draggingNoteId || draggingNoteFolderId) {
                e.preventDefault()
                setNoteDropTarget('standalone')
              }
            }}
            onDragLeave={() => setNoteDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (draggingNoteFolderId) handleNoteFolderDrop(undefined)
              else handleNoteDrop(undefined)
            }}
            className={`transition-colors rounded mx-1 ${noteDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
          >
            {standaloneNotes.map((n) => renderNote(n, false))}
            {noteDropTarget === 'standalone' && standaloneNotes.length === 0 && draggingNoteId && (
              <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">
                Drop here to remove from folder
              </p>
            )}
            {noteDropTarget === 'standalone' && draggingNoteFolderId && (
              <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">
                Drop here to move to top level
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* By Date section */}
        {dateNotes.length > 0 && (
          <div className="border-t border-slate-200 dark:border-white/[0.07] mt-1 pt-1">
            <CollapsibleSection
              label="By Date"
              count={dateNotes.length}
              accent="slate"
              defaultOpen={false}
              headerExtra={
                <MoreMenu
                  items={[
                    { label: 'New note', icon: Plus, onClick: () => handleNewNote() },
                  ]}
                />
              }
            >
              <DateTree
                items={dateNotes}
                getDate={(n) => n.date}
                renderItem={(n) => (
                  <SidebarNavItem
                    id={n.id}
                    label={n.title || 'Untitled'}
                    active={activeNoteId === n.id}
                    route={`/notes/${n.id}`}
                    icon={FileText}
                    indent
                    onDelete={handleDeleteNote}
                    deleteTitle="Delete note"
                  />
                )}
                onNewForDate={handleNewNoteForDate}
                emptyMessage="No date-based notes yet"
                newItemTitle="New note"
              />
            </CollapsibleSection>
          </div>
        )}

      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={editingNoteFolder}
          parentId={pendingParentNoteFolderId}
          onSave={handleSaveNoteFolder}
          onClose={closeNoteFolderForm}
        />
      )}

      {noteDelete.pendingId && (
        <ConfirmDeleteDialog
          message={noteDelete.pendingMessage}
          anchorRect={noteDelete.anchorRect}
          onConfirm={noteDelete.confirmDelete}
          onCancel={noteDelete.cancelDelete}
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

export default NotesNav
