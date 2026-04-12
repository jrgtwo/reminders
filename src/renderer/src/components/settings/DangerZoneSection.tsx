import { Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'

export default function DangerZoneSection({
  deleteAccountStatus,
  setDeleteAccountStatus,
  handleDeleteAccountRequest,
}: {
  deleteAccountStatus: 'idle' | 'confirm' | 'sending' | 'sent' | 'error'
  setDeleteAccountStatus: (s: 'idle' | 'confirm' | 'sending' | 'sent' | 'error') => void
  handleDeleteAccountRequest: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
        Danger zone
      </h2>
      <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-3">
          <Trash2 size={20} className="text-red-400 dark:text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Delete account</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>
        {deleteAccountStatus === 'sent' ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 shrink-0">
            <Check size={16} />
            <span className="text-xs font-medium">Request sent</span>
          </div>
        ) : deleteAccountStatus === 'confirm' ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
            <Button variant="ghost" size="sm" onClick={() => setDeleteAccountStatus('idle')}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleDeleteAccountRequest}>
              Delete
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={deleteAccountStatus === 'sending'}
            onClick={() => setDeleteAccountStatus('confirm')}
          >
            {deleteAccountStatus === 'sending' && (
              <RefreshCw size={20} className="animate-spin" />
            )}
            {deleteAccountStatus === 'error' && <AlertCircle size={20} />}
            {deleteAccountStatus === 'sending'
              ? 'Requesting…'
              : deleteAccountStatus === 'error'
                ? 'Failed'
                : 'Request deletion'}
          </Button>
        )}
      </div>
    </section>
  )
}
