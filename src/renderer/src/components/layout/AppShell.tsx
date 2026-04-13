import { Outlet } from 'react-router-dom'
import { Settings, Cloud, CloudOff, Loader2, X } from 'lucide-react'
import BottomNav, { SideNav } from './BottomNav'
import SearchBar from './SearchBar'
import ReminderForm from '../reminders/ReminderForm'
import NotificationBanner from '../NotificationBanner'
import { useAppShell } from './hooks/useAppShell'
import logo from '../../assets/logo.svg'
import logoCheckmark from '../../assets/logo-checkmark.svg'

function formatLastSynced(isoStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function AppShell() {
  const {
    searchRef,
    navigate,
    setErrorDismissed,
    newReminderDate,
    setNewReminderDate,
    saveReminder,
    isLoggedIn,
    overdueCount,
    upcomingCount,
    syncStatus,
    lastSyncedAt,
    showErrorBanner,
  } = useAppShell()

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Top header */}
      <header className="relative flex flex-col border-b border-black/30 dark:border-black/60 shrink-0 bg-[var(--bg-header)]">
        {/* Full-width (lg+): single row, 3-col grid so search is truly centered */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-center px-4 h-16">
          {/* Left: brand + stats */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col leading-none shrink-0 hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img src={logo} alt="Reminder Today Logo" className="w-28 mb-1" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/reminders', { state: { section: 'overdue' } })}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <span
                  className={`text-[11px] font-bold tabular-nums ${overdueCount > 0 ? 'text-[#e8a045]' : 'text-white/50'}`}
                >
                  {overdueCount}
                </span>
                <span
                  className={`text-[11px] ${overdueCount > 0 ? 'text-[#e8a045]/70' : 'text-white/50'}`}
                >
                  overdue
                </span>
              </button>
              <button
                onClick={() => navigate('/reminders', { state: { section: 'upcoming' } })}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <span
                  className={`text-[11px] font-bold tabular-nums ${upcomingCount > 0 ? 'text-[var(--color-upcoming)]' : 'text-white/50'}`}
                >
                  {upcomingCount}
                </span>
                <span
                  className={`text-[11px] ${upcomingCount > 0 ? 'text-[var(--color-upcoming)]/70' : 'text-white/50'}`}
                >
                  upcoming
                </span>
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
              <div className="flex items-center gap-1.5 text-[10px] text-white/55">
                {syncStatus === 'syncing' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Syncing</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <CloudOff size={20} className="text-[#e8a045]" />
                ) : lastSyncedAt ? (
                  <>
                    <Cloud size={20} />
                    <span>{formatLastSynced(lastSyncedAt)}</span>
                  </>
                ) : null}
              </div>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="w-7 h-7 flex items-center justify-center rounded text-white/55 hover:text-white/80 hover:bg-white/[0.08] transition-all"
              title="Settings (Ctrl+,)"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Narrow (below lg): two rows */}
        <div className="lg:hidden flex flex-col">
          {/* Row 1: brand + sync + settings */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col leading-none hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img src={logoCheckmark} alt="Reminder Today Logo" className="w-8 mb-1" />
            </button>
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <div className="flex items-center gap-1.5 text-[10px] text-white/55">
                  {syncStatus === 'syncing' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Syncing</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <CloudOff size={20} className="text-[#e8a045]" />
                  ) : lastSyncedAt ? (
                    <>
                      <Cloud size={20} />
                      <span>{formatLastSynced(lastSyncedAt)}</span>
                    </>
                  ) : null}
                </div>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="w-7 h-7 flex items-center justify-center rounded text-white/55 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                title="Settings (Ctrl+,)"
              >
                <Settings size={20} />
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
          <CloudOff size={20} />
          <span className="flex-1">
            Sync failed — changes are saved locally and will sync when resolved.
          </span>
          <button
            onClick={() => setErrorDismissed(true)}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <NotificationBanner />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 h-full overflow-auto bg-[var(--bg-app)]">
          <Outlet />
        </main>
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
