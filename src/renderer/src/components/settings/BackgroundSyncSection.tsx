import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Button from '../ui/Button'
import { getDebugInfo, type RunnerDebugInfo } from '../../lib/runnerBridge'

function formatRelative(isoStr: string): string {
  if (!isoStr) return 'Never'
  const t = new Date(isoStr).getTime()
  if (Number.isNaN(t)) return isoStr
  const minutes = Math.floor((Date.now() - t) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function BackgroundSyncSection() {
  const [info, setInfo] = useState<RunnerDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const next = await getDebugInfo()
    setInfo(next)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Background sync
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-2 text-sm">
        {info === null ? (
          <p className="text-gray-500">{loading ? 'Loading…' : 'Background runner not available'}</p>
        ) : (
          <>
            <Row label="Last run" value={formatRelative(info.last_run_at)} />
            <Row label="Reminders synced" value={info.last_synced_count || '0'} />
            <Row
              label="Credentials"
              value={info.has_credentials ? 'Stored' : 'Not yet shared with runner'}
            />
            {info.last_run_error && (
              <Row label="Last error" value={info.last_run_error} valueClass="text-red-500" />
            )}
          </>
        )}
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  valueClass = '',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-900 dark:text-gray-100 truncate ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}
