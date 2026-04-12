import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import {
  ArrowLeft,
  Download,
  Upload,
  Check,
  AlertCircle,
  LogOut,
  Mail,
  RefreshCw,
  Cloud,
  CloudOff,
  ShieldCheck,
  Trash2,
  RotateCcw
} from 'lucide-react'
import Button from '../ui/Button'
import { useSettingsPage } from './hooks/useSettingsPage'
import type { Theme } from './hooks/useSettingsPage'
import { getConsent, setConsent } from '../../lib/consent'

const isNativePlatform =
  typeof window !== 'undefined' &&
  (!!(window as any).electronAPI || !!(window as any).Capacitor?.isNativePlatform?.())

function PrivacySection() {
  const consent = getConsent()
  const [analytics, setAnalytics] = useState(consent.analytics)

  const handleToggle = (checked: boolean) => {
    setAnalytics(checked)
    setConsent({ analytics: checked })
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Privacy
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Analytics cookies
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Anonymous usage data to help us improve the app
            </p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => handleToggle(e.target.checked)}
            className="accent-[#6498c8] w-4 h-4 cursor-pointer"
          />
        </label>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Essential cookies
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Required for the app to function (always on)
            </p>
          </div>
          <input type="checkbox" checked disabled className="accent-[#6498c8] w-4 h-4" />
        </div>
      </div>
    </section>
  )
}

function formatLastSynced(isoStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function SettingsPage() {
  const {
    navigate,
    theme,
    setTheme,
    timeFormat,
    setTimeFormat,
    user,
    isLoggedIn,
    signOut,
    syncStatus,
    lastSyncedAt,
    triggerSync,
    migrationPref,
    handleMigrationPrefChange,
    importStatus,
    exporting,
    importing,
    exportingIcal,
    importingIcal,
    rotateStatus,
    setRotateStatus,
    resetStatus,
    setResetStatus,
    clearStatus,
    setClearStatus,
    email,
    setEmail,
    magicLinkStatus,
    setMagicLinkStatus,
    captchaToken,
    setCaptchaToken,
    turnstileRef,
    handleRotateKey,
    handleSendMagicLink,
    handleExport,
    handleImport,
    handleExportIcal,
    handleImportIcal,
    handleResetFromCloud,
    handleClearLocalData
  } = useSettingsPage()

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Account
        </h2>
        {isLoggedIn && user ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[#f0f0f0] text-sm font-medium">
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={20} />
              Sign out
            </Button>
          </div>
        ) : magicLinkStatus === 'sent' ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <Check size={20} />
            <div>
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs mt-0.5 opacity-80">We sent a sign-in link to {email}</p>
            </div>
            <button
              className="ml-auto text-xs underline opacity-70 hover:opacity-100"
              onClick={() => setMagicLinkStatus('idle')}
            >
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={magicLinkStatus === 'sending' || !captchaToken}
              >
                <Mail size={20} />
                {magicLinkStatus === 'sending' ? 'Sending…' : 'Send link'}
              </Button>
            </div>
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
            {magicLinkStatus === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-[#e8a045]">
                <AlertCircle size={20} />
                Failed to send — check your email and try again.
              </p>
            )}
          </form>
        )}
      </section>

      {/* Sync — only when logged in */}
      {isLoggedIn && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sync
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
      )}

      {/* Security — only when logged in */}
      {isLoggedIn && (
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
      )}

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Appearance
        </h2>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-3">
          <p className="text-sm font-medium">Theme</p>
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                { id: 'light', label: 'Light', header: '#1c1f26', body: '#F3F4F6' },
                { id: 'dark', label: 'Dark', header: '#010409', body: '#0d1117' },
                { id: 'dim', label: 'Dim', header: '#1c2128', body: '#22272e' },
                { id: 'warm', label: 'Warm', header: '#100e0a', body: '#18150f' },
                { id: 'midnight', label: 'Midnight', header: '#060606', body: '#000000' },
                { id: 'nord', label: 'Nord', header: '#242933', body: '#2e3440' },
                { id: 'forest', label: 'Forest', header: '#0d150d', body: '#141f14' },
                { id: 'dusk', label: 'Dusk', header: '#0f0a16', body: '#16101e' },
                { id: 'grey', label: 'Grey', header: '#111111', body: '#1a1a1a' }
              ] as { id: Theme; label: string; header: string; body: string }[]
            ).map(({ id, label, header, body }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-2 group`}
              >
                <div
                  className={`w-full aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                    theme === id
                      ? 'border-blue-500 shadow-md shadow-blue-500/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="h-[30%]" style={{ background: header }} />
                  <div className="h-[70%]" style={{ background: body }} />
                </div>
                <span
                  className={`text-xs font-medium ${theme === id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Time format</p>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-[var(--bg-elevated)]">
              {(['12h', '24h'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setTimeFormat(fmt)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    timeFormat === fmt
                      ? 'bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy — web only (Electron/Capacitor don't use cookies) */}
      {!isNativePlatform && <PrivacySection />}

      {/* Data */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Data
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
            <div>
              <p className="text-sm font-medium">Import from iCal</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Import events from an .ics file exported by Google Calendar, Apple Calendar,
                Outlook, and more
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
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

      {/* Keyboard shortcuts */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Keyboard shortcuts
        </h2>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] space-y-2.5">
          {(
            [
              ['/', 'Focus search'],
              ['n', 'New reminder (day view)'],
              ['t', 'New todo'],
              ['Esc', 'Go back / close'],
              ['Ctrl / ⌘  ,', 'Open settings']
            ] as [string, string][]
          ).map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs bg-white dark:bg-[var(--bg-elevated)] border border-gray-200 dark:border-[var(--border)] rounded font-mono text-gray-700 dark:text-gray-300">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
