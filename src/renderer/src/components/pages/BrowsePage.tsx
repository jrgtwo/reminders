import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  List,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderOpen,
  Pencil,
  Trash2,
  FolderPlus,
} from 'lucide-react'
import { useListsNav } from '../lists/hooks/useListsNav'
import { useNotesNav } from '../notes/hooks/useNotesNav'
import { usePagination } from '../../hooks/usePagination'
import { Pagination } from '../ui/Pagination'
import { MoreMenu, type MoreMenuItem } from '../ui/MoreMenu'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { DateTree } from '../ui/FolderNav'
import FolderForm from '../lists/FolderForm'
import NoteFolderForm from '../notes/NoteFolderForm'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import type { TodoList, TodoFolder, Note, NoteFolder } from '../../types/models'

type Tab = 'lists' | 'notes' | 'byDate'

const PAGE_SIZE = 20

function PaginatedItems<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode }) {
  const { page, totalPages, totalItems, pageItems, prevPage, nextPage } = usePagination(items, PAGE_SIZE)

  return (
    <div className="space-y-2">
      {pageItems.map((item, i) => (
        <div key={i}>{renderItem(item)}</div>
      ))}
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPrev={prevPage} onNext={nextPage} />
    </div>
  )
}

function BrowseItem({
  id,
  label,
  sublabel,
  icon: Icon,
  route,
  active,
  onDelete,
  deleteTitle = 'Delete',
}: {
  id: string
  label: string
  sublabel?: string
  icon: typeof List
  route: string
  active: boolean
  onDelete: (id: string, rect: DOMRect) => void
  deleteTitle?: string
}) {
  const navigate = useNavigate()

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl btn-3d cursor-pointer hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 ${
        active
          ? 'bg-white dark:bg-white/[0.04] border border-[var(--accent)]/20 dark:border-[var(--accent)]/[0.15] border-b-[2.5px] border-b-[var(--accent)]/30 dark:border-b-[var(--accent)]/[0.25]'
          : 'bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] hover:bg-slate-50 dark:hover:bg-white/[0.07]'
      }`}
      onClick={() => navigate(route)}
    >
      <Icon
        size={20}
        className={active ? 'shrink-0 text-[var(--accent)]' : 'shrink-0 text-slate-400 dark:text-white/50'}
      />
      <div className="flex-1 min-w-0">
        <span
          className={`text-[15px] block truncate ${
            active ? 'font-medium text-[var(--accent)]' : 'text-slate-600 dark:text-white/60'
          }`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-[12px] text-slate-400 dark:text-white/50 block truncate">{sublabel}</span>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreMenu
          items={[{ label: deleteTitle, icon: Trash2, onClick: (rect) => onDelete(id, rect), danger: true }]}
        />
      </div>
    </div>
  )
}

function BrowseFolderSection<
  F extends { id: string; name: string },
  I,
>({
  rootFolders,
  folderChildrenMap,
  getOrder,
  getItemsInFolder,
  renderItem,
  expandedFolders,
  onToggleFolder,
  onNewItemInFolder,
  onEditFolder,
  onDeleteFolder,
  onNewSubfolder,
}: {
  rootFolders: F[]
  folderChildrenMap: Map<string | undefined, F[]>
  getOrder: (f: F) => number
  getItemsInFolder: (folderId: string) => I[]
  renderItem: (item: I) => ReactNode
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
  onNewItemInFolder: (folderId: string) => void
  onEditFolder?: (folder: F) => void
  onDeleteFolder?: (id: string, anchorRect: DOMRect) => void
  onNewSubfolder?: (parentId: string) => void
}) {
  function renderFolder(folder: F, depth: number): ReactNode {
    const items = getItemsInFolder(folder.id)
    const collapsed = !expandedFolders.has(folder.id)
    const children = (folderChildrenMap.get(folder.id) ?? []).sort((a, b) => getOrder(a) - getOrder(b))
    const pl = 20 + depth * 20

    const menuItems: MoreMenuItem[] = [
      { label: 'New item', icon: Plus, onClick: () => onNewItemInFolder(folder.id) },
      ...(onNewSubfolder
        ? [{ label: 'New subfolder', icon: FolderPlus, onClick: () => onNewSubfolder(folder.id) }]
        : []),
      ...(onEditFolder
        ? [{ label: 'Rename folder', icon: Pencil, onClick: () => onEditFolder(folder) }]
        : []),
      ...(onDeleteFolder
        ? [{
            label: 'Delete folder',
            icon: Trash2,
            onClick: (rect: DOMRect) => onDeleteFolder(folder.id, rect),
            danger: true,
          }]
        : []),
    ] as MoreMenuItem[]

    return (
      <div key={folder.id}>
        <div
          onClick={() => onToggleFolder(folder.id)}
          className="group flex items-center gap-2 w-full py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-300/80 dark:border-b-white/[0.15] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 btn-3d cursor-pointer rounded-xl mb-1"
          style={{ paddingLeft: `${pl}px`, paddingRight: '12px' }}
        >
          {collapsed ? (
            <ChevronRight size={20} className="text-slate-300 dark:text-white/50 shrink-0" />
          ) : (
            <ChevronDown size={20} className="text-slate-300 dark:text-white/50 shrink-0" />
          )}
          <FolderOpen size={18} className="text-slate-400 dark:text-white/50 shrink-0" />
          <span className="text-[15px] font-semibold text-slate-500 dark:text-white/60 truncate flex-1 text-left">
            {folder.name}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-white/50 mr-1">
            {items.length}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <MoreMenu items={menuItems} />
          </div>
        </div>
        {!collapsed && (
          <div style={{ paddingLeft: `${depth * 20}px` }}>
            {children.map((child) => renderFolder(child, depth + 1))}
            <PaginatedItems items={items} renderItem={renderItem} />
          </div>
        )}
      </div>
    )
  }

  return <>{rootFolders.map((f) => renderFolder(f, 0))}</>
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('lists')

  // Lists data
  const {
    adHocLists,
    dateLists,
    standaloneLists,
    folderChildrenMap: listFolderChildrenMap,
    rootFolders: listRootFolders,
    expandedFolders: listExpandedFolders,
    activeListId,
    toggleFolder: toggleListFolder,
    openNewList,
    handleDeleteList,
    handleDeleteFolder: handleDeleteListFolder,
    openFolderForm: openListFolderForm,
    closeFolderForm: closeListFolderForm,
    handleSaveFolder: handleSaveListFolder,
    folderFormOpen: listFolderFormOpen,
    editingFolder: editingListFolder,
    listDelete,
    folderDelete: listFolderDelete,
  } = useListsNav()

  // Notes data
  const {
    allNotes,
    standaloneNotes,
    dateNotes,
    noteFolderChildrenMap,
    rootNoteFolders,
    expandedNoteFolders,
    activeNoteId,
    toggleNoteFolder,
    handleNewNote,
    handleNewNoteForDate,
    handleDeleteNote,
    handleDeleteNoteFolder,
    openNoteFolderForm,
    closeNoteFolderForm,
    handleSaveNoteFolder,
    noteFolderFormOpen,
    editingNoteFolder,
    pendingParentNoteFolderId,
    noteDelete,
    folderDelete: noteFolderDelete,
  } = useNotesNav()

  const tabs: { id: Tab; label: string; icon: typeof List }[] = [
    { id: 'lists', label: 'My Lists', icon: List },
    { id: 'notes', label: 'My Notes', icon: FileText },
    { id: 'byDate', label: 'By Date', icon: Calendar },
  ]

  function renderListItem(l: TodoList) {
    return (
      <BrowseItem
        id={l.id}
        label={l.name}
        sublabel={l.dueDate}
        icon={List}
        route={`/lists/${l.id}`}
        active={activeListId === l.id}
        onDelete={handleDeleteList}
        deleteTitle="Delete list"
      />
    )
  }

  function renderNoteItem(n: Note) {
    return (
      <BrowseItem
        id={n.id}
        label={n.title || 'Untitled'}
        sublabel={n.content ? n.content.slice(0, 80).replace(/\n/g, ' ') : undefined}
        icon={FileText}
        route={`/notes/${n.id}`}
        active={activeNoteId === n.id}
        onDelete={handleDeleteNote}
        deleteTitle="Delete note"
      />
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-white/[0.07] px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/50 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            className="text-xl text-slate-900 dark:text-white/80 tracking-tight"
            style={{ fontFamily: "'Bree Serif', serif" }}
          >
            Browse
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-slate-200 dark:border-white/[0.07] px-4 md:px-6">
        <div className="max-w-4xl mx-auto flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all active:translate-y-[1px] ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/60'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          {activeTab === 'lists' && (
            <ListsTabContent
              rootFolders={listRootFolders}
              folderChildrenMap={listFolderChildrenMap}
              adHocLists={adHocLists}
              standaloneLists={standaloneLists}
              expandedFolders={listExpandedFolders}
              toggleFolder={toggleListFolder}
              openNewList={openNewList}
              openFolderForm={openListFolderForm}
              handleDeleteFolder={handleDeleteListFolder}
              renderItem={renderListItem}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTabContent
              rootFolders={rootNoteFolders}
              folderChildrenMap={noteFolderChildrenMap}
              allNotes={allNotes}
              standaloneNotes={standaloneNotes}
              expandedFolders={expandedNoteFolders}
              toggleFolder={toggleNoteFolder}
              handleNewNote={handleNewNote}
              openFolderForm={openNoteFolderForm}
              handleDeleteFolder={handleDeleteNoteFolder}
              renderItem={renderNoteItem}
            />
          )}

          {activeTab === 'byDate' && (
            <ByDateTabContent
              dateLists={dateLists}
              dateNotes={dateNotes}
              activeListId={activeListId}
              activeNoteId={activeNoteId}
              handleDeleteList={handleDeleteList}
              handleDeleteNote={handleDeleteNote}
              openNewList={openNewList}
              handleNewNoteForDate={handleNewNoteForDate}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      {listFolderFormOpen && (
        <FolderForm
          folder={editingListFolder}
          onSave={handleSaveListFolder}
          onClose={closeListFolderForm}
        />
      )}
      {noteFolderFormOpen && (
        <NoteFolderForm
          folder={editingNoteFolder}
          parentId={pendingParentNoteFolderId}
          onSave={handleSaveNoteFolder}
          onClose={closeNoteFolderForm}
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
      {listFolderDelete.pendingId && (
        <ConfirmDeleteDialog
          message={listFolderDelete.pendingMessage}
          anchorRect={listFolderDelete.anchorRect}
          onConfirm={listFolderDelete.confirmDelete}
          onCancel={listFolderDelete.cancelDelete}
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
      {noteFolderDelete.pendingId && (
        <ConfirmDeleteDialog
          message={noteFolderDelete.pendingMessage}
          anchorRect={noteFolderDelete.anchorRect}
          onConfirm={noteFolderDelete.confirmDelete}
          onCancel={noteFolderDelete.cancelDelete}
        />
      )}
    </div>
  )
}

/* ---- Tab Content Components ---- */

function ListsTabContent({
  rootFolders,
  folderChildrenMap,
  adHocLists,
  standaloneLists,
  expandedFolders,
  toggleFolder,
  openNewList,
  openFolderForm,
  handleDeleteFolder,
  renderItem,
}: {
  rootFolders: TodoFolder[]
  folderChildrenMap: Map<string | undefined, TodoFolder[]>
  adHocLists: TodoList[]
  standaloneLists: TodoList[]
  expandedFolders: Set<string>
  toggleFolder: (id: string) => void
  openNewList: (opts?: { folderId?: string; dueDate?: string }) => void
  openFolderForm: (folder: TodoFolder | null) => void
  handleDeleteFolder: (id: string, rect: DOMRect) => void
  renderItem: (l: TodoList) => ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
          My Lists
        </h2>
        <div className="flex items-center gap-1">
          <MoreMenu
            items={[
              { label: 'New list', icon: Plus, onClick: () => openNewList() },
              { label: 'New folder', icon: FolderOpen, onClick: () => openFolderForm(null) },
            ]}
          />
        </div>
      </div>

      {rootFolders.length === 0 && standaloneLists.length === 0 && (
        <p className="text-[13px] text-slate-400 dark:text-white/50 py-4">No lists yet</p>
      )}

      <BrowseFolderSection
        rootFolders={rootFolders}
        folderChildrenMap={folderChildrenMap}
        getOrder={(f) => f.order}
        getItemsInFolder={(folderId) => adHocLists.filter((l) => l.folderId === folderId)}
        renderItem={renderItem}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onNewItemInFolder={(folderId) => openNewList({ folderId })}
        onEditFolder={(folder) => openFolderForm(folder)}
        onDeleteFolder={handleDeleteFolder}
      />

      {standaloneLists.length > 0 && (
        <div className="mt-2">
          <PaginatedItems items={standaloneLists} renderItem={renderItem} />
        </div>
      )}
    </div>
  )
}

function NotesTabContent({
  rootFolders,
  folderChildrenMap,
  allNotes,
  standaloneNotes,
  expandedFolders,
  toggleFolder,
  handleNewNote,
  openFolderForm,
  handleDeleteFolder,
  renderItem,
}: {
  rootFolders: NoteFolder[]
  folderChildrenMap: Map<string | undefined, NoteFolder[]>
  allNotes: Map<string, Note>
  standaloneNotes: Note[]
  expandedFolders: Set<string>
  toggleFolder: (id: string) => void
  handleNewNote: (folderId?: string) => void
  openFolderForm: (folder: NoteFolder | null, parentId?: string) => void
  handleDeleteFolder: (id: string, rect: DOMRect) => void
  renderItem: (n: Note) => ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
          My Notes
        </h2>
        <div className="flex items-center gap-1">
          <MoreMenu
            items={[
              { label: 'New note', icon: Plus, onClick: () => handleNewNote(undefined) },
              { label: 'New folder', icon: FolderOpen, onClick: () => openFolderForm(null, undefined) },
            ]}
          />
        </div>
      </div>

      {rootFolders.length === 0 && standaloneNotes.length === 0 && (
        <p className="text-[13px] text-slate-400 dark:text-white/50 py-4">No notes yet</p>
      )}

      <BrowseFolderSection
        rootFolders={rootFolders}
        folderChildrenMap={folderChildrenMap}
        getOrder={(f) => f.displayOrder}
        getItemsInFolder={(folderId) =>
          Array.from(allNotes.values()).filter((n) => n.folderId === folderId)
        }
        renderItem={renderItem}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onNewItemInFolder={handleNewNote}
        onEditFolder={(folder) => openFolderForm(folder)}
        onDeleteFolder={handleDeleteFolder}
        onNewSubfolder={(parentId) => openFolderForm(null, parentId)}
      />

      {standaloneNotes.length > 0 && (
        <div className="mt-2">
          <PaginatedItems items={standaloneNotes} renderItem={renderItem} />
        </div>
      )}
    </div>
  )
}

function ByDateTabContent({
  dateLists,
  dateNotes,
  activeListId,
  activeNoteId,
  handleDeleteList,
  handleDeleteNote,
  openNewList,
  handleNewNoteForDate,
}: {
  dateLists: TodoList[]
  dateNotes: Note[]
  activeListId?: string
  activeNoteId?: string
  handleDeleteList: (id: string, rect: DOMRect) => void
  handleDeleteNote: (id: string, rect: DOMRect) => void
  openNewList: (opts?: { folderId?: string; dueDate?: string }) => void
  handleNewNoteForDate: (date: string) => void
}) {
  return (
    <div className="space-y-4">
      {dateLists.length > 0 && (
        <CollapsibleSection label="Lists by Date" count={dateLists.length} accent="slate" defaultOpen>
          <DateTree
            items={dateLists}
            getDate={(l) => l.dueDate}
            renderItem={(l) => (
              <BrowseItem
                id={l.id}
                label={l.name}
                sublabel={l.dueDate}
                icon={List}
                route={`/lists/${l.id}`}
                active={activeListId === l.id}
                onDelete={handleDeleteList}
                deleteTitle="Delete list"
              />
            )}
            onNewForDate={(date) => openNewList({ dueDate: date })}
            emptyMessage="No date-based lists"
            newItemTitle="New list"
          />
        </CollapsibleSection>
      )}

      {dateNotes.length > 0 && (
        <CollapsibleSection label="Notes by Date" count={dateNotes.length} accent="slate" defaultOpen>
          <DateTree
            items={dateNotes}
            getDate={(n) => n.date}
            renderItem={(n) => (
              <BrowseItem
                id={n.id}
                label={n.title || 'Untitled'}
                sublabel={n.content ? n.content.slice(0, 80).replace(/\n/g, ' ') : undefined}
                icon={FileText}
                route={`/notes/${n.id}`}
                active={activeNoteId === n.id}
                onDelete={handleDeleteNote}
                deleteTitle="Delete note"
              />
            )}
            onNewForDate={handleNewNoteForDate}
            emptyMessage="No date-based notes"
            newItemTitle="New note"
          />
        </CollapsibleSection>
      )}

      {dateLists.length === 0 && dateNotes.length === 0 && (
        <p className="text-[13px] text-slate-400 dark:text-white/50 py-8 text-center">
          No date-based items yet
        </p>
      )}
    </div>
  )
}
