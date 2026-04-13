import { ShieldCheck, RefreshCw, Check, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'

export default function SecuritySection({
  rotateStatus,
  setRotateStatus,
  handleRotateKey,
}: {
  rotateStatus: 'idle' | 'confirm' | 'rotating' | 'done' | 'error'
  setRotateStatus: (s: 'idle' | 'confirm' | 'rotating' | 'done' | 'error') => void
  handleRotateKey: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Security
      </h2>
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Rotate encryption key</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Generate a new key and re-encrypt all local data
            </p>
          </div>
        </div>
        {rotateStatus === 'confirm' ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
            <Button variant="ghost" size="sm" onClick={() => setRotateStatus('idle')}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRotateKey}>
              Rotate
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={
              rotateStatus === 'rotating' || rotateStatus === 'done' || rotateStatus === 'error'
            }
            onClick={() => setRotateStatus('confirm')}
          >
            {rotateStatus === 'rotating' && <RefreshCw size={20} className="animate-spin" />}
            {rotateStatus === 'done' && <Check size={20} />}
            {rotateStatus === 'error' && <AlertCircle size={20} />}
            {rotateStatus === 'rotating'
              ? 'Rotating…'
              : rotateStatus === 'done'
                ? 'Done'
                : rotateStatus === 'error'
                  ? 'Failed'
                  : 'Rotate'}
          </Button>
        )}
      </div>
    </section>
  )
}
