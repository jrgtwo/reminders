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
    <div className="flex flex-col h-screen bg-white dark:bg-[#080c14] text-gray-900 dark:text-gray-100 relative overflow-hidden">
      {/* Ambient background orbs — dark mode only */}
      <div className="hidden dark:block absolute top-[-10%] right-[15%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="hidden dark:block absolute bottom-[-5%] left-[10%] w-[500px] h-[500px] bg-indigo-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden dark:block absolute top-[40%] right-[-5%] w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top header */}
      <header className="relative flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-white/[0.08] shrink-0 bg-white dark:bg-white/[0.05] dark:backdrop-blur-xl">
        <span className="text-sm font-semibold text-gray-700 dark:text-white/80 hidden md:block shrink-0">
          Reminders
        </span>
        <div className="flex-1 flex justify-center">
          <SearchBar ref={searchRef} />
        </div>
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 shrink-0">
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
          className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-all shrink-0"
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
