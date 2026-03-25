import { useRef, useCallback, useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Settings, Cloud, CloudOff, Loader2, X } from 'lucide-react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import SearchBar from './SearchBar'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useUIStore } from '../../store/ui.store'
import { useRemindersStore } from '../../store/reminders.store'
import { useAuthStore } from '../../store/auth.store'
import { useSyncStore } from '../../store/sync.store'
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
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const syncStatus = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)

  // Reset dismissed state whenever a new sync completes with error
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
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top header */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block shrink-0">
          Reminders
        </span>
        <div className="flex-1 flex justify-center">
          <SearchBar ref={searchRef} />
        </div>
        {/* Sync indicator — only when logged in */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
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
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
          title="Settings (Ctrl+,)"
        >
          <Settings size={16} />
        </button>
      </header>

      {/* Sync error banner */}
      {showErrorBanner && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs shrink-0">
          <CloudOff size={13} />
          <span className="flex-1">Sync failed — your changes are saved locally and will sync when the issue is resolved.</span>
          <button
            onClick={() => setErrorDismissed(true)}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800/40 rounded"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <div className="hidden md:flex">
          <LeftSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Right sidebar — desktop only */}
        <div className="hidden md:flex">
          <RightSidebar />
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Global new-reminder form (triggered from sidebar / tray) */}
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
