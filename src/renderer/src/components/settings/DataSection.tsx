import {
  Download,
  Upload,
  Check,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import Button from '../ui/Button'

export default function DataSection({
  isLoggedIn,
  syncStatus,
  importStatus,
  exporting,
  importing,
  exportingIcal,
  importingIcal,
  resetStatus,
  setResetStatus,
  clearStatus,
  setClearStatus,
  handleExport,
  handleImport,
  handleExportIcal,
  handleImportIcal,
  handleResetFromCloud,
  handleClearLocalData,
}: {
  isLoggedIn: boolean
  syncStatus: string
  importStatus: { ok: boolean; msg: string } | null
  exporting: boolean
  importing: boolean
  exportingIcal: boolean
  importingIcal: boolean
  resetStatus: 'idle' | 'confirm' | 'running' | 'done' | 'error'
  setResetStatus: (s: 'idle' | 'confirm' | 'running' | 'done' | 'error') => void
  clearStatus: 'idle' | 'confirm' | 'running' | 'done'
  setClearStatus: (s: 'idle' | 'confirm' | 'running' | 'done') => void
  handleExport: () => void
  handleImport: () => void
  handleExportIcal: () => void
  handleImportIcal: () => void
  handleResetFromCloud: () => void
  handleClearLocalData: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Data
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
          <div>
            <p className="text-sm font-medium">Export data</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Download all reminders, notes, and todos as JSON
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={exporting}>
            <Download size={20} />
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
          <div>
            <p className="text-sm font-medium">Import data</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Restore from a previously exported JSON file
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleImport} disabled={importing}>
            <Upload size={20} />
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
          <div>
            <p className="text-sm font-medium">Export as iCal</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Download reminders as an .ics file for Google Calendar, Apple Calendar, Outlook, and
              more
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExportIcal} disabled={exportingIcal}>
            <Download size={20} />
            {exportingIcal ? 'Exporting…' : 'Export .ics'}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
          <div>
            <p className="text-sm font-medium">Import from iCal</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Import events from an .ics file exported by Google Calendar, Apple Calendar, Outlook,
              and more
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleImportIcal} disabled={importingIcal}>
            <Upload size={20} />
            {importingIcal ? 'Importing…' : 'Import .ics'}
          </Button>
        </div>
        {importStatus && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              importStatus.ok
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-[#e8a045]/[0.08] text-red-700 dark:text-[#e8a045]'
            }`}
          >
            {importStatus.ok ? <Check size={20} /> : <AlertCircle size={20} />}
            {importStatus.msg}
          </div>
        )}
        {isLoggedIn && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
            <div className="flex items-center gap-3">
              <RotateCcw size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Reset from cloud</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Replace local data with the current cloud copy
                </p>
              </div>
            </div>
            {resetStatus === 'confirm' ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
                <Button variant="ghost" size="sm" onClick={() => setResetStatus('idle')}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleResetFromCloud}>
                  Reset
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={resetStatus === 'running' || syncStatus === 'syncing'}
                onClick={() => setResetStatus('confirm')}
              >
                {resetStatus === 'running' && <RefreshCw size={20} className="animate-spin" />}
                {resetStatus === 'done' && <Check size={20} />}
                {resetStatus === 'error' && <AlertCircle size={20} />}
                {resetStatus === 'running'
                  ? 'Resetting…'
                  : resetStatus === 'done'
                    ? 'Done'
                    : resetStatus === 'error'
                      ? 'Failed'
                      : 'Reset'}
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Clear local data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Wipe all data from this device{isLoggedIn ? ' — cloud copy stays intact' : ''}
              </p>
            </div>
          </div>
          {clearStatus === 'confirm' ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
              <Button variant="ghost" size="sm" onClick={() => setClearStatus('idle')}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleClearLocalData}>
                Clear
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={clearStatus === 'running'}
              onClick={() => setClearStatus('confirm')}
            >
              {clearStatus === 'running' && <RefreshCw size={20} className="animate-spin" />}
              {clearStatus === 'done' && <Check size={20} />}
              {clearStatus === 'running'
                ? 'Clearing…'
                : clearStatus === 'done'
                  ? 'Done'
                  : 'Clear'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
