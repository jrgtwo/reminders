import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Settings, Cloud, CloudOff, Loader2, X } from 'lucide-react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import SearchBar from './SearchBar'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { usePageTracking } from '../../hooks/usePageTracking'
import { useUIStore } from '../../store/ui.store'
import { useRemindersStore } from '../../store/reminders.store'
import { useTodosStore } from '../../store/todos.store'
import { useNotesStore } from '../../store/notes.store'
import { useAuthStore } from '../../store/auth.store'
import { useSyncStore } from '../../store/sync.store'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { today } from '../../utils/dates'
import ReminderForm from '../reminders/ReminderForm'

function formatLastSynced(isoStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function AppShell() {
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const focusSearch = useCallback(() => searchRef.current?.focus(), [])
  const [errorDismissed, setErrorDismissed] = useState(false)

  const setLeftOpen = useUIStore((s) => s.setLeftOpen)
  const setRightOpen = useUIStore((s) => s.setRightOpen)
  const setReminderSection = useUIStore((s) => s.setReminderSection)
  const loadAllNotes = useNotesStore((s) => s.loadAllNotes)

  useEffect(() => { loadAllNotes() }, [loadAllNotes])

  const newReminderDate = useUIStore((s) => s.newReminderDate)
  const setNewReminderDate = useUIStore((s) => s.setNewReminderDate)
  const saveReminder = useRemindersStore((s) => s.save)
  const reminders = useRemindersStore((s) => s.reminders)
  const todos = useTodosStore((s) => s.todos)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const overdueCount = useMemo(() => {
    const end = today().subtract({ days: 1 })
    const start = end.subtract({ days: 365 })
    let count = 0
    for (const r of reminders) {
      count += getOccurrencesInRange(r, start, end).length
    }
    return count
  }, [reminders])

  const upcomingCount = useMemo(() => {
    const start = today()
    const end = start.add({ days: 30 })
    let count = 0
    for (const r of reminders) {
      count += getOccurrencesInRange(r, start, end).length
    }
    return count
  }, [reminders])

  const todoCount = todos.filter((t) => !t.completed && !(t.listId && !t.dueDate)).length
  const syncStatus = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)

  const prevSyncStatus = useRef(syncStatus)
  useEffect(() => {
    if (prevSyncStatus.current === 'syncing' && syncStatus === 'error') {
      setErrorDismissed(false)
    }
    prevSyncStatus.current = syncStatus
  }, [syncStatus])

  const showErrorBanner = isLoggedIn && syncStatus === 'error' && !errorDismissed

  useKeyboardShortcuts(focusSearch)
  usePageTracking()

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Top header */}
      <header className="relative flex flex-col border-b border-black/30 dark:border-black/60 shrink-0 bg-[var(--bg-header)]">

        {/* Full-width (lg+): single row, 3-col grid so search is truly centered */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-center px-4 h-16">
          {/* Left: brand + stats */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex flex-col leading-none shrink-0 hover:opacity-80 transition-opacity" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="text-[11px] text-white/40 tracking-[0.2em] uppercase font-medium" style={{ fontFamily: "'Bree Serif', serif", fontWeight: 400 }}>Reminder</span>
              <span className="text-[28px] text-white/80 tracking-tight -mt-0.5" style={{ fontFamily: "'Bree Serif', serif", fontWeight: 400 }}>Today</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setLeftOpen(true)
                    setReminderSection('overdue', true)
                    setReminderSection('upcoming', false)
                  } else {
                    navigate('/reminders')
                  }
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <span className={`text-[11px] font-bold tabular-nums ${overdueCount > 0 ? 'text-[#e8a045]' : 'text-white/25'}`}>{overdueCount}</span>
                <span className={`text-[11px] ${overdueCount > 0 ? 'text-[#e8a045]/70' : 'text-white/20'}`}>overdue</span>
              </button>
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setLeftOpen(true)
                    setReminderSection('upcoming', true)
                    setReminderSection('overdue', false)
                  } else {
                    navigate('/reminders')
                  }
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <span className={`text-[11px] font-bold tabular-nums ${upcomingCount > 0 ? 'text-[#6498c8]' : 'text-white/25'}`}>{upcomingCount}</span>
                <span className={`text-[11px] ${upcomingCount > 0 ? 'text-[#6498c8]/70' : 'text-white/20'}`}>upcoming</span>
              </button>
              <button onClick={() => { if (window.innerWidth >= 1024) setRightOpen(true); else navigate('/todos') }} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <span className={`text-[11px] font-bold tabular-nums ${todoCount > 0 ? 'text-blue-400' : 'text-white/25'}`}>{todoCount}</span>
                <span className={`text-[11px] ${todoCount > 0 ? 'text-blue-400/70' : 'text-white/20'}`}>todos</span>
              </button>
            </div>
          </div>
          {/* Center: search */}
          <div className="flex justify-center">
            <SearchBar ref={searchRef} />
          </div>
          {/* Right: sync + settings */}
          <div className="flex items-center justify-end gap-2">
            {isLoggedIn && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                {syncStatus === 'syncing' ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>Syncing</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <CloudOff size={12} className="text-[#e8a045]" />
                ) : lastSyncedAt ? (
                  <>
                    <Cloud size={11} />
                    <span>{formatLastSynced(lastSyncedAt)}</span>
                  </>
                ) : null}
              </div>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="w-7 h-7 flex items-center justify-center rounded text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-all"
              title="Settings (Ctrl+,)"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Narrow (below lg): two rows */}
        <div className="lg:hidden flex flex-col">
          {/* Row 1: brand + sync + settings */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
            <button onClick={() => navigate('/')} className="flex flex-col leading-none hover:opacity-80 transition-opacity" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-medium" style={{ fontFamily: "'Bree Serif', serif", fontWeight: 400 }}>Reminder</span>
              <span className="text-[22px] text-white/80 tracking-tight -mt-0.5" style={{ fontFamily: "'Bree Serif', serif", fontWeight: 400 }}>Today</span>
            </button>
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  {syncStatus === 'syncing' ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>Syncing</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <CloudOff size={12} className="text-[#e8a045]" />
                  ) : lastSyncedAt ? (
                    <>
                      <Cloud size={11} />
                      <span>{formatLastSynced(lastSyncedAt)}</span>
                    </>
                  ) : null}
                </div>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="w-7 h-7 flex items-center justify-center rounded text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                title="Settings (Ctrl+,)"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
          {/* Row 2: search */}
          <div className="flex items-center px-4 h-11">
            <div className="flex-1 flex justify-center">
              <SearchBar ref={searchRef} />
            </div>
          </div>
        </div>

      </header>

      {/* Sync error banner */}
      {showErrorBanner && (
        <div className="relative flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-[#e8a045]/[0.08] border-b border-red-200 dark:border-[#e8a045]/20 text-red-700 dark:text-[#e8a045] text-xs shrink-0">
          <CloudOff size={13} />
          <span className="flex-1">
            Sync failed — changes are saved locally and will sync when resolved.
          </span>
          <button
            onClick={() => setErrorDismissed(true)}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex shrink-0">
          <LeftSidebar />
        </div>
        <main className="flex-1 h-full overflow-auto bg-[var(--bg-app)]">
          <Outlet />
        </main>
        <div className="hidden lg:flex shrink-0">
          <RightSidebar />
        </div>
      </div>

      <BottomNav />

      {newReminderDate && (
        <ReminderForm
          date={newReminderDate}
          reminder={null}
          onSave={async (r) => {
            await saveReminder(r)
            setNewReminderDate(null)
          }}
          onClose={() => setNewReminderDate(null)}
        />
      )}
    </div>
  )
}
