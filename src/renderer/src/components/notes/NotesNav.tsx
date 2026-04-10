import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'
import { Plus, FolderOpen, FileText, ArrowUpRight } from 'lucide-react'
import type { Note } from '../../types/models'
import NoteFolderForm from './NoteFolderForm'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { SidebarNavItem, FolderTree, DateTree } from '../ui/FolderNav'
import { useNotesNav } from './hooks/useNotesNav'

export interface NotesNavHandle {
  openNewNote: () => void
}

const NotesNav = forwardRef<NotesNavHandle>(function NotesNav(_, ref) {
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
    navigate,
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
      <CollapsibleSection
        label="Notes"
        count={noteCount}
        accent="blue"
        defaultOpen={true}
        headerExtra={
          <button
            onClick={() => navigate('/notes')}
            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
            title="Go to Notes"
          >
            <ArrowUpRight size={11} />
          </button>
        }
      >
        {noteCount === 0 && noteFolders.length === 0 && (
          <p className="text-[11px] text-slate-400 dark:text-white/25 px-4 py-2">No notes yet</p>
        )}

        {/* My Notes Collapsible Section */}
        <CollapsibleSection
          label="My Notes"
          count={standaloneNotes.length + rootNoteFolders.length}
          accent="slate"
          defaultOpen={false}
        >
          <div className="flex items-center justify-end gap-0.5 px-3 py-1 border-b border-slate-100 dark:border-white/[0.04]">
            <button
              onClick={() => handleNewNote(undefined)}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New note"
            >
              <Plus size={11} />
            </button>
            <button
              onClick={() => openNoteFolderForm(null, undefined)}
              className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              title="New folder"
            >
              <FolderOpen size={11} />
            </button>
          </div>
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
            expandedFolders={expandedNoteFolders}
            onToggleFolder={toggleNoteFolder}
            onEditFolder={(folder) => openNoteFolderForm(folder)}
            onDeleteFolder={handleDeleteNoteFolder}
            onNewSubfolder={(parentId) => openNoteFolderForm(null, parentId)}
            onNewItemInFolder={handleNewNote}
          />

          <div
            onDragOver={(e) => {
              if (draggingNoteId) {
                e.preventDefault()
                setNoteDropTarget('standalone')
              }
            }}
            onDragLeave={() => setNoteDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault()
              handleNoteDrop(undefined)
            }}
            className={`transition-colors rounded mx-1 ${noteDropTarget === 'standalone' ? 'bg-[#6498c8]/10 dark:bg-[#6498c8]/[0.08] ring-1 ring-[#6498c8]/30' : ''}`}
          >
            {standaloneNotes.map((n) => renderNote(n, false))}
            {noteDropTarget === 'standalone' && standaloneNotes.length === 0 && (
              <p className="text-[11px] text-[#6498c8]/60 px-4 py-2">
                Drop here to remove from folder
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
                <button
                  onClick={() => handleNewNote()}
                  className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                  title="New date-based note"
                >
                  <Plus size={11} />
                </button>
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
      </CollapsibleSection>

      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={editingNoteFolder}
          parentId={pendingParentNoteFolderId}
          onSave={handleSaveNoteFolder}
          onClose={closeNoteFolderForm}
        />
      )}

    </>
  )
})

export default NotesNav
