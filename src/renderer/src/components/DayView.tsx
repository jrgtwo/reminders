import { ArrowLeft, ArrowRight, Trash2, Edit3, Pencil, ChevronRight, Check, Clock, RefreshCw } from 'lucide-react'
import { Temporal } from '@js-temporal/polyfill'
import { formatTime } from '../utils/dates'
import type { Note } from '../types/models'
import ReminderInlineEditor from './reminders/ReminderInlineEditor'
import SortableTodoList from './todos/TodoList'
import NoteEditor from './notes/NoteEditor'
import ConfirmDeleteDialog from './ui/ConfirmDeleteDialog'
import { useDayView } from './hooks/useDayView'

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return {
      label: 'Today',
      cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
    }
  if (cmp < 0)
    return {
      label: 'Past',
      cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/30 border border-slate-200 dark:border-white/10'
    }
  return null
}

export default function DayView() {
  const {
    dateStr,
    plainDate,
    tab,
    setTab,
    expandedReminderId,
    setExpandedReminderId,
    editingNoteId,
    setEditingNoteId,
    editingItemId,
    setEditingItemId,
    editingListTitleId,
    setEditingListTitleId,
    expandedListIds,
    notes,
    saveNote,
    items,
    reorderItems,
    dayReminders,
    overdueReminders,
    upcomingReminders,
    dayLists,
    timeFormat,
    toggleComplete,
    save,
    handleToggleItem,
    handleAddItem,
    handleSaveEdit,
    handleSaveDesc,
    handleCancelEdit,
    toggleListExpanded,
    handleCreateInlineList,
    handleSaveListTitle,
    handleAddReminder,
    handleCancelReminder,
    handleNewNote,
    handleDeleteNote,
    handleDeleteReminder,
    handleDeleteList,
    handleDeleteItem,
    reminderDelete,
    noteDelete,
    listDelete,
    itemDelete,
    navigate,
  } = useDayView()

  const { weekday, rest } = formatDayHeading(plainDate)
  const status = getDayStatus(plainDate)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-7">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-[13px] text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 mb-8 transition-colors -ml-0.5"
      >
        <ArrowLeft size={20} />
        Calendar
      </button>

      {/* Heading */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-1">
          <h1
            className="text-3xl text-slate-900 dark:text-white/80 tracking-tight leading-none"
            style={{ fontFamily: "'Bree Serif', serif" }}
          >
            {weekday}
          </h1>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>
        <p
          className="text-sm text-slate-400 dark:text-white/35 font-medium"
          style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 400 }}
        >
          {rest}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200/60 dark:border-white/[0.07] mb-6">
        {(
          [
            { id: 'notes', label: 'Notes', count: null },
            {
              id: 'reminders',
              label: 'Reminders',
              count: dayReminders.length,
              overdue: overdueReminders.length,
              upcoming: upcomingReminders.length
            },
            { id: 'todos', label: 'Todos', count: dayLists.length }
          ] as const
        ).map(({ id, label, count, ...rest }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === id
                ? 'text-slate-900 dark:text-[#f0f0f0]'
                : 'text-slate-400 dark:text-white/35 hover:text-slate-600 dark:hover:text-white/60'
            }`}
          >
            {label}
            {id === 'reminders' ? (
              <>
                {'overdue' in rest && rest.overdue > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8a045]/[0.15] text-[#e8a045]">
                    {rest.overdue}
                  </span>
                )}
                {'upcoming' in rest && rest.upcoming > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6498c8]/[0.15] text-[#6498c8]">
                    {rest.upcoming}
                  </span>
                )}
              </>
            ) : (
              count !== null &&
              count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6498c8]/[0.15] text-[#6498c8]">
                  {count}
                </span>
              )
            )}
            {tab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'notes' && (
        <div>
          {(() => {
            const existingNotes = Array.from(notes.values()).filter((n) => n.date === dateStr)

            const handleNoteChange = (updatedNote: Note) => {
              saveNote(updatedNote)
            }

            if (existingNotes.length === 0) {
              return (
                <div className="mb-8 min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-[13px] text-slate-400 dark:text-white/25 mb-4">
                        No notes for this day yet.
                      </p>
                      <button
                        onClick={handleNewNote}
                        className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                      >
                        + Create your first note
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div className="mb-8 flex flex-col gap-2">
                {existingNotes.map((note) => (
                  <div key={note.id}>
                    <button
                      onClick={() => setEditingNoteId(note.id === editingNoteId ? null : note.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.09] transition-colors shadow-sm group"
                    >
                      <Edit3
                        size={20}
                        className={`shrink-0 transition-colors ${note.id === editingNoteId ? 'text-[#6498c8]' : 'text-slate-400 dark:text-white/35'}`}
                      />
                      <div className="flex-1 min-w-0">
                        {note.title ? (
                          <div className="text-[14px] font-medium text-slate-800 dark:text-white/80 truncate">
                            {note.title}
                          </div>
                        ) : (
                          <div className="text-[13px] text-slate-400 dark:text-white/35 italic">
                            Untitled
                          </div>
                        )}
                        {note.content && (
                          <div className="text-[12px] text-slate-400 dark:text-white/25 mt-0.5 truncate">
                            {note.content.replace(/[#*`>\[\]]/g, '').slice(0, 100)}
                            {note.content.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <ArrowRight
                        size={20}
                        className={`shrink-0 text-slate-300 dark:text-white/20 transition-transform ${note.id === editingNoteId ? 'rotate-90' : ''}`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id, e)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={20} />
                      </button>
                    </button>
                    {note.id === editingNoteId && (
                      <NoteEditor
                        note={note}
                        onChange={handleNoteChange}
                        onDelete={(e) => handleDeleteNote(note.id, e)}
                        onBack={() => setEditingNoteId(null)}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={handleNewNote}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Add note
                </button>
              </div>
            )
          })()}
        </div>
      )}

      {tab === 'reminders' && (
        <div className="mb-8 flex flex-col gap-2">
          {(() => {
            const uncompleted = dayReminders.filter((r) => !r.completedDates.includes(dateStr))
            const completed = dayReminders.filter((r) => r.completedDates.includes(dateStr))
            const sortByTime = (a: typeof dayReminders[0], b: typeof dayReminders[0]) => {
              if (a.startTime && b.startTime) return a.startTime < b.startTime ? -1 : 1
              if (a.startTime) return -1
              if (b.startTime) return 1
              return 0
            }
            const sortedUncompleted = uncompleted.sort(sortByTime)
            const sortedCompleted = completed.sort(sortByTime)

            if (dayReminders.length === 0) {
              return (
                <div className="min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-[13px] text-slate-400 dark:text-white/25 mb-4">No reminders for this day yet.</p>
                      <button
                        onClick={handleAddReminder}
                        className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                      >
                        + Add your first reminder
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            const renderReminder = (reminder: typeof dayReminders[0], isCompleted: boolean) => {
              const isExpanded = expandedReminderId === reminder.id
              return (
                <div key={reminder.id}>
                  <button
                    onClick={() => setExpandedReminderId(isExpanded ? null : reminder.id)}
                    className={`flex items-start gap-3 w-full px-4 py-3 text-left bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.09] transition-colors shadow-sm group ${
                      isExpanded ? 'rounded-t-xl' : 'rounded-xl'
                    } ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id, dateStr) }}
                      role="checkbox"
                      aria-checked={isCompleted}
                      className={`mt-[3px] w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-[#f0f0f0]'
                          : 'border-slate-300 dark:border-white/20 hover:border-emerald-400 dark:hover:border-emerald-400'
                      }`}
                    >
                      {isCompleted && <Check size={20} strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-medium leading-snug ${isCompleted ? 'line-through text-slate-300 dark:text-white/20' : 'text-slate-800 dark:text-white/80'}`}>
                        {reminder.title || <span className="italic text-slate-400 dark:text-white/35">Untitled</span>}
                      </p>
                      {reminder.description && (
                        <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5 leading-snug">{reminder.description}</p>
                      )}
                      {(reminder.startTime || reminder.recurrence) && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {reminder.startTime && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                              <Clock size={20} />
                              {formatTime(reminder.startTime, timeFormat)}{reminder.endTime ? ` – ${formatTime(reminder.endTime, timeFormat)}` : ''}
                            </span>
                          )}
                          {reminder.recurrence && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 rounded">
                              <RefreshCw size={20} />
                              {reminder.recurrence.frequency}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ArrowRight
                      size={20}
                      className={`shrink-0 text-slate-300 dark:text-white/20 transition-transform mt-1 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteReminder(reminder.id, e) }}
                      className="w-8 h-8 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 size={20} />
                    </button>
                  </button>
                  {isExpanded && (
                    <ReminderInlineEditor
                      reminder={reminder}
                      onSave={async (r) => { await save(r); setExpandedReminderId(null) }}
                      onCancel={() => handleCancelReminder(reminder)}
                      onDelete={(e) => handleDeleteReminder(reminder.id, e)}
                    />
                  )}
                </div>
              )
            }

            return (
              <>
                {sortedUncompleted.map((r) => renderReminder(r, false))}
                {sortedCompleted.length > 0 && (
                  <>
                    <div className="border-t border-slate-200 dark:border-white/[0.07] mt-2 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">
                        Completed
                      </p>
                    </div>
                    {sortedCompleted.map((r) => renderReminder(r, true))}
                  </>
                )}
                <button
                  onClick={handleAddReminder}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  Add reminder
                </button>
              </>
            )
          })()}
        </div>
      )}

      {tab === 'todos' && (
        <div className="mb-8 flex flex-col gap-2">
          {dayLists.length === 0 ? (
            <div className="min-h-[400px] bg-white/[0.03] dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-[13px] text-slate-400 dark:text-white/25 mb-4">No lists for this day yet.</p>
                  <button
                    onClick={handleCreateInlineList}
                    className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                  >
                    + New list
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {dayLists.map((l) => {
                const isExpanded = expandedListIds.has(l.id)
                const listItems = (items.get(l.id) ?? []).filter((i) => !i.completed).sort((a, b) => a.order - b.order)
                const completedItems = (items.get(l.id) ?? []).filter((i) => i.completed).sort((a, b) => a.order - b.order)
                const totalCount = listItems.length + completedItems.length
                return (
                  <div key={l.id} className="bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] rounded-xl shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => toggleListExpanded(l.id)}
                        className="flex items-center gap-1.5 min-w-0 flex-1 group"
                      >
                        <ChevronRight
                          size={20}
                          className={`shrink-0 text-slate-400 dark:text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        {editingListTitleId === l.id ? (
                          <input
                            autoFocus
                            defaultValue={l.name}
                            placeholder="List name"
                            className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 dark:text-white/80 placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => handleSaveListTitle(l.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleSaveListTitle(l.id, e.currentTarget.value) }
                              if (e.key === 'Escape') { e.preventDefault(); handleSaveListTitle(l.id, e.currentTarget.value) }
                            }}
                          />
                        ) : (
                          <span className="text-[14px] font-medium text-slate-800 dark:text-white/80 truncate">
                            {l.name || <span className="italic text-slate-400 dark:text-white/35">Untitled</span>}
                          </span>
                        )}
                        {!isExpanded && totalCount > 0 && (
                          <span className="shrink-0 text-[11px] text-slate-400 dark:text-white/30 ml-1">{totalCount}</span>
                        )}
                      </button>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => setEditingListTitleId(l.id)}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteList(l.id, e)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                        {isExpanded && (
                          <button
                            onClick={() => handleAddItem(l.id)}
                            className="text-[12px] font-medium text-[#6498c8] hover:opacity-80 transition-opacity"
                          >
                            + Add item
                          </button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-0 border-t border-slate-100 dark:border-white/[0.05]">
                        {listItems.length === 0 && completedItems.length === 0 ? (
                          <p className="text-[13px] text-slate-400 dark:text-white/25 pt-3">No items yet. Add one above.</p>
                        ) : (
                          <>
                            <div className="pt-2">
                              <SortableTodoList
                                todos={listItems}
                                onToggle={handleToggleItem}
                                onEdit={(i) => setEditingItemId(i.id)}
                                onDelete={handleDeleteItem}
                                onReorder={(ids) => reorderItems(l.id, ids)}
                                editingItemId={editingItemId}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                onSaveDesc={handleSaveDesc}
                              />
                            </div>
                            {completedItems.length > 0 && (
                              <div className="mt-4 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 dark:text-white/25 mb-2">Done</p>
                                <SortableTodoList
                                  todos={completedItems}
                                  onToggle={handleToggleItem}
                                  onEdit={(i) => setEditingItemId(i.id)}
                                  onDelete={handleDeleteItem}
                                  onReorder={(ids) => reorderItems(l.id, ids)}
                                  editingItemId={editingItemId}
                                  onSaveEdit={handleSaveEdit}
                                  onCancelEdit={handleCancelEdit}
                                  onSaveDesc={handleSaveDesc}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <button
                onClick={handleCreateInlineList}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-left bg-transparent border border-dashed border-slate-300 dark:border-white/[0.06] hover:border-[#6498c8] dark:hover:border-[#6498c8] text-[#6498c8] dark:text-[#6498c8] text-[13px] font-medium transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                New list
              </button>
            </>
          )}
        </div>
      )}
      {reminderDelete.pendingId && (
        <ConfirmDeleteDialog
          message={reminderDelete.pendingMessage}
          anchorRect={reminderDelete.anchorRect}
          onConfirm={reminderDelete.confirmDelete}
          onCancel={reminderDelete.cancelDelete}
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

      {listDelete.pendingId && (
        <ConfirmDeleteDialog
          message={listDelete.pendingMessage}
          anchorRect={listDelete.anchorRect}
          onConfirm={listDelete.confirmDelete}
          onCancel={listDelete.cancelDelete}
        />
      )}

      {itemDelete.pendingId && (
        <ConfirmDeleteDialog
          message={itemDelete.pendingMessage}
          anchorRect={itemDelete.anchorRect}
          onConfirm={itemDelete.confirmDelete}
          onCancel={itemDelete.cancelDelete}
        />
      )}
    </div>
  )
}
