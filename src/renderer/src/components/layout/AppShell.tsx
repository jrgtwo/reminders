import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Settings, Cloud, CloudOff, Loader2, X } from 'lucide-react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import SearchBar from './SearchBar'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useUIStore } from '../../store/ui.store'
import { useRemindersStore } from '../../store/reminders.store'
import { useTodosStore } from '../../store/todos.store'
import { useAuthStore } from '../../store/auth.store'
import { useSyncStore } from '../../store/sync.store'
import { getOccurrencesInRange } from '../../utils/recurrence'
import { today } from '../../utils/dates'
import ReminderForm from '../reminders/ReminderForm'

function formatLastSynced(isoStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (minutes < 1) return 'Synced just now'
  if (minutes < 60) return `Synced ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `Synced ${hours}h ago`
}

export default function AppShell() {
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const focusSearch = useCallback(() => searchRef.current?.focus(), [])
  const [errorDismissed, setErrorDismissed] = useState(false)

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

  const todoCount = todos.filter((t) => !t.completed).length
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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#07101e] text-gray-900 dark:text-gray-100 relative overflow-hidden">
      {/* Top header */}
      <header className="relative flex items-center gap-4 px-4 py-2.5 border-b border-gray-900/20 dark:border-white/[0.12] shrink-0 bg-gray-900 dark:bg-[#060a11]">
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <span className="text-sm font-bold text-white tracking-wide">REMINDERS</span>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className={overdueCount > 0 ? 'text-red-400' : 'text-white/30'}>
              {overdueCount} overdue
            </span>
            <span className="text-white/20">·</span>
            <span className={upcomingCount > 0 ? 'text-white/70' : 'text-white/30'}>
              {upcomingCount} upcoming
            </span>
            <span className="text-white/20">·</span>
            <span className={todoCount > 0 ? 'text-blue-300' : 'text-white/30'}>
              {todoCount} todos
            </span>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <SearchBar ref={searchRef} />
        </div>
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-white/40 shrink-0">
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Syncing…</span>
              </>
            ) : syncStatus === 'error' ? (
              <CloudOff size={14} className="text-red-400" />
            ) : lastSyncedAt ? (
              <>
                <Cloud size={13} />
                <span>{formatLastSynced(lastSyncedAt)}</span>
              </>
            ) : null}
          </div>
        )}
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          title="Settings (Ctrl+,)"
        >
          <Settings size={16} />
        </button>
      </header>

      {/* Sync error banner */}
      {showErrorBanner && (
        <div className="relative flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 text-xs shrink-0">
          <CloudOff size={13} />
          <span className="flex-1">Sync failed — your changes are saved locally and will sync when the issue is resolved.</span>
          <button
            onClick={() => setErrorDismissed(true)}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <LeftSidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <div className="hidden md:flex">
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
