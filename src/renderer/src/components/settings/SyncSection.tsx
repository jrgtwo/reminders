import { RefreshCw, Cloud, CloudOff } from 'lucide-react'
import Button from '../ui/Button'

function formatLastSynced(isoStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function SyncSection({
  syncStatus,
  lastSyncedAt,
  triggerSync,
  migrationPref,
  handleMigrationPrefChange,
}: {
  syncStatus: string
  lastSyncedAt: string | null
  triggerSync: () => void
  migrationPref: 'sync' | 'skip' | null
  handleMigrationPrefChange: (val: 'sync' | 'skip' | null) => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Sync
      </h2>
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
        <div className="flex items-center gap-3">
          {syncStatus === 'error' ? (
            <CloudOff size={20} className="text-red-400" />
          ) : (
            <Cloud size={20} className="text-gray-400 dark:text-gray-500" />
          )}
          <div>
            <p className="text-sm font-medium">
              {syncStatus === 'syncing'
                ? 'Syncing…'
                : syncStatus === 'error'
                  ? 'Sync failed'
                  : 'Cloud sync'}
            </p>
            {lastSyncedAt && syncStatus !== 'syncing' && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last synced: {formatLastSynced(lastSyncedAt)}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerSync}
          disabled={syncStatus === 'syncing'}
        >
          <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          {syncStatus === 'syncing' ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
        <div>
          <p className="text-sm font-medium">On login conflict</p>
          <p className="text-xs text-gray-400 mt-0.5">
            What to do when local and cloud data differ
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-[var(--bg-elevated)]">
          {(['sync', null, 'skip'] as const).map((val) => {
            const label =
              val === 'sync' ? 'Always merge' : val === 'skip' ? 'Always skip' : 'Ask'
            const active = migrationPref === val
            return (
              <button
                key={String(val)}
                onClick={() => handleMigrationPrefChange(val)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  active
                    ? 'bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
