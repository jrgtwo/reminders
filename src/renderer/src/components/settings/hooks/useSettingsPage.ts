import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rotateEncryptionKey } from '../../../lib/keyRotation'
import { useUIStore, type Theme, type TimeFormat } from '../../../store/ui.store'
import { useAuthStore } from '../../../store/auth.store'
import { useSyncStore } from '../../../store/sync.store'
import { exportToFile, importFromFile, exportToIcalFile, importFromIcalFile } from '../../../utils/exportImport'

export function useSettingsPage() {
  const navigate = useNavigate()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const timeFormat = useUIStore((s) => s.timeFormat)
  const setTimeFormat = useUIStore((s) => s.setTimeFormat)
  const { user, isLoggedIn, sendMagicLink, signOut } = useAuthStore()
  const syncStatus = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const triggerSync = useSyncStore((s) => s.trigger)
  const resetFromCloud = useSyncStore((s) => s.resetFromCloud)
  const clearLocalData = useSyncStore((s) => s.clearLocalData)

  const migrationPrefKey = user ? `reminder_migration_pref_${user.id}` : null
  const [migrationPref, setMigrationPref] = useState<'sync' | 'skip' | null>(
    () => (migrationPrefKey ? (localStorage.getItem(migrationPrefKey) as 'sync' | 'skip' | null) : null)
  )

  function handleMigrationPrefChange(val: 'sync' | 'skip' | null) {
    if (!migrationPrefKey) return
    if (val) localStorage.setItem(migrationPrefKey, val)
    else localStorage.removeItem(migrationPrefKey)
    setMigrationPref(val)
  }

  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exportingIcal, setExportingIcal] = useState(false)
  const [importingIcal, setImportingIcal] = useState(false)
  const [rotateStatus, setRotateStatus] = useState<'idle' | 'confirm' | 'rotating' | 'done' | 'error'>('idle')
  const [resetStatus, setResetStatus] = useState<'idle' | 'confirm' | 'running' | 'done' | 'error'>('idle')
  const [clearStatus, setClearStatus] = useState<'idle' | 'confirm' | 'running' | 'done'>('idle')
  const [email, setEmail] = useState('')
  const [magicLinkStatus, setMagicLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleRotateKey() {
    if (!user) return
    setRotateStatus('rotating')
    try {
      await rotateEncryptionKey(user.id)
      setRotateStatus('done')
      setTimeout(() => setRotateStatus('idle'), 3000)
    } catch {
      setRotateStatus('error')
      setTimeout(() => setRotateStatus('idle'), 4000)
    }
  }

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

  async function handleExportIcal() {
    setExportingIcal(true)
    try {
      await exportToIcalFile()
    } finally {
      setExportingIcal(false)
    }
  }

  async function handleImportIcal() {
    setImportingIcal(true)
    setImportStatus(null)
    try {
      const result = await importFromIcalFile()
      setImportStatus({ ok: result.success, msg: result.message })
    } finally {
      setImportingIcal(false)
    }
  }

  async function handleResetFromCloud() {
    setResetStatus('running')
    try {
      await resetFromCloud()
      setResetStatus('done')
      setTimeout(() => setResetStatus('idle'), 3000)
    } catch {
      setResetStatus('error')
      setTimeout(() => setResetStatus('idle'), 4000)
    }
  }

  async function handleClearLocalData() {
    setClearStatus('running')
    await clearLocalData()
    setClearStatus('done')
    setTimeout(() => setClearStatus('idle'), 3000)
  }

  return {
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
    handleRotateKey,
    handleSendMagicLink,
    handleExport,
    handleImport,
    handleExportIcal,
    handleImportIcal,
    handleResetFromCloud,
    handleClearLocalData,
  } as const
}

export type { Theme, TimeFormat }
