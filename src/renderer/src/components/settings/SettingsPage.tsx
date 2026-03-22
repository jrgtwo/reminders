import { useState } from 'react'
import { ArrowLeft, Moon, Sun, Download, Upload, Check, AlertCircle, LogOut, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/ui.store'
import { useAuthStore } from '../../store/auth.store'
import Button from '../ui/Button'
import { exportToFile, importFromFile } from '../../utils/exportImport'

export default function SettingsPage() {
  const navigate = useNavigate()
  const darkMode = useUIStore((s) => s.darkMode)
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode)
  const { user, isLoggedIn, sendMagicLink, signOut } = useAuthStore()
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [email, setEmail] = useState('')
  const [magicLinkStatus, setMagicLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setMagicLinkStatus('sending')
    try {
      await sendMagicLink(email.trim())
      setMagicLinkStatus('sent')
    } catch {
      setMagicLinkStatus('error')
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportToFile()
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    setImporting(true)
    setImportStatus(null)
    try {
      const result = await importFromFile()
      setImportStatus({ ok: result.success, msg: result.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft size={16} />
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
        ) : magicLinkStatus === 'sent' ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <Check size={16} />
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
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" disabled={magicLinkStatus === 'sending'}>
                <Mail size={14} />
                {magicLinkStatus === 'sending' ? 'Sending…' : 'Send link'}
              </Button>
            </div>
            {magicLinkStatus === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} />
                Failed to send — check your email and try again.
              </p>
            )}
          </form>
        )}
      </section>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Appearance
        </h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon size={16} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun size={16} className="text-gray-600 dark:text-gray-300" />
            )}
            <span className="text-sm font-medium">Dark mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Data
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium">Export data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Download all reminders, notes, and todos as JSON
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExport} disabled={exporting}>
              <Download size={14} />
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium">Import data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Restore from a previously exported JSON file
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleImport} disabled={importing}>
              <Upload size={14} />
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </div>
          {importStatus && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                importStatus.ok
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {importStatus.ok ? <Check size={14} /> : <AlertCircle size={14} />}
              {importStatus.msg}
            </div>
          )}
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Keyboard shortcuts
        </h2>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2.5">
          {(
            [
              ['/', 'Focus search'],
              ['n', 'New reminder (day view)'],
              ['t', 'New todo'],
              ['Esc', 'Go back / close'],
              ['Ctrl / ⌘  ,', 'Open settings'],
            ] as [string, string][]
          ).map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded font-mono text-gray-700 dark:text-gray-300">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
