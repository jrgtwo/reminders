import { Temporal } from '@js-temporal/polyfill'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import { useDayView } from '../hooks/useDayView'
import DayViewNotesTab from './DayViewNotesTab'
import DayViewRemindersTab from './DayViewRemindersTab'
import DayViewTodosTab from './DayViewTodosTab'
import { useUIStore } from '../../store/ui.store'

function formatDayHeading(date: Temporal.PlainDate) {
  return {
    weekday: date.toLocaleString('en-US', { weekday: 'long' }),
    rest: date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function getDayStatus(date: Temporal.PlainDate) {
  const cmp = Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO())
  if (cmp === 0)
    return {
      label: 'Today',
      cls: 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)]',
    }
  if (cmp < 0)
    return {
      label: 'Past',
      cls: 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-white/55 border border-slate-200 dark:border-white/10',
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

  const setView = useUIStore((s) => s.setView)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)

  const handleViewSwitch = (v: 'month' | 'week') => {
    setView(v)
    navigate('/')
  }

  const isToday = dateStr === Temporal.Now.plainDateISO().toString()

  const handleToday = () => {
    const today = Temporal.Now.plainDateISO().toString()
    setSelectedDate(today)
    navigate(`/day/${today}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — matches CalendarHeader layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0 bg-[var(--bg-surface)] gap-2">
        <div className="flex items-end gap-3">
          <div className="flex items-baseline gap-2.5 leading-none">
            <h2
              className="text-3xl tracking-tight text-slate-900 dark:text-white/80"
              style={{ fontFamily: "'Bree Serif', serif" }}
            >
              {weekday}
            </h2>
            <span
              className="text-xl font-normal text-slate-300 dark:text-white/50 tracking-tight"
              style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif", fontWeight: 400 }}
            >
              {rest}
            </span>
          </div>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1 ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <button
            onClick={handleToday}
            className={[
              'px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25',
              isToday
                ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.12] border-b-[2.5px] border-b-slate-300 dark:border-b-white/[0.2] shadow-sm'
                : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60',
            ].join(' ')}
          >
            Today
          </button>
          <div className="flex gap-1">
            {(['month', 'week'] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleViewSwitch(v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border btn-3d capitalize hover:-translate-y-[3px] dark:hover:brightness-125 dark:hover:border-white/25 bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-white/55 border-slate-200 dark:border-white/[0.08] border-b-[2.5px] border-b-slate-250 dark:border-b-white/[0.12] hover:text-slate-600 dark:hover:text-white/60"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-7 w-full">

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
              upcoming: upcomingReminders.length,
            },
            { id: 'todos', label: 'Todos', count: dayLists.length },
          ] as const
        ).map(({ id, label, count, ...rest }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === id
                ? 'text-slate-900 dark:text-[#f0f0f0]'
                : 'text-slate-400 dark:text-white/55 hover:text-slate-600 dark:hover:text-white/60'
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-upcoming-muted)] text-[var(--color-upcoming)]">
                    {rest.upcoming}
                  </span>
                )}
              </>
            ) : (
              count !== null &&
              count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-upcoming-muted)] text-[var(--color-upcoming)]">
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
        <DayViewNotesTab
          dateStr={dateStr}
          notes={notes}
          editingNoteId={editingNoteId}
          setEditingNoteId={setEditingNoteId}
          saveNote={saveNote}
          handleNewNote={handleNewNote}
          handleDeleteNote={handleDeleteNote}
        />
      )}

      {tab === 'reminders' && (
        <DayViewRemindersTab
          dateStr={dateStr}
          dayReminders={dayReminders}
          expandedReminderId={expandedReminderId}
          setExpandedReminderId={setExpandedReminderId}
          timeFormat={timeFormat}
          toggleComplete={toggleComplete}
          save={save}
          handleAddReminder={handleAddReminder}
          handleCancelReminder={handleCancelReminder}
          handleDeleteReminder={handleDeleteReminder}
        />
      )}

      {tab === 'todos' && (
        <DayViewTodosTab
          dayLists={dayLists}
          items={items}
          expandedListIds={expandedListIds}
          editingListTitleId={editingListTitleId}
          setEditingListTitleId={setEditingListTitleId}
          editingItemId={editingItemId}
          setEditingItemId={setEditingItemId}
          toggleListExpanded={toggleListExpanded}
          handleToggleItem={handleToggleItem}
          handleAddItem={handleAddItem}
          handleSaveEdit={handleSaveEdit}
          handleSaveDesc={handleSaveDesc}
          handleCancelEdit={handleCancelEdit}
          handleDeleteItem={handleDeleteItem}
          handleDeleteList={handleDeleteList}
          handleCreateInlineList={handleCreateInlineList}
          handleSaveListTitle={handleSaveListTitle}
          reorderItems={reorderItems}
        />
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
    </div>
  )
}
