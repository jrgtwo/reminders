import { useRef, useState, useEffect } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { rotateEncryptionKey } from '../../../lib/keyRotation'
import { supabase } from '../../../lib/supabase'
import { useUIStore, type Theme, type TimeFormat } from '../../../store/ui.store'
import { useAuthStore } from '../../../store/auth.store'
import { useSyncStore } from '../../../store/sync.store'
import { exportToFile, importFromFile, exportToIcalFile, importFromIcalFile } from '../../../utils/exportImport'
import { useSubscriptionPrices, isWebPlatform } from '../../account/lib/prices'

export function useSettingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const timeFormat = useUIStore((s) => s.timeFormat)
  const setTimeFormat = useUIStore((s) => s.setTimeFormat)
  const { user, isLoggedIn, plan, sendMagicLink, signOut } = useAuthStore()
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
  const [upgradeStatus, setUpgradeStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly')
  const [portalStatus, setPortalStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const prices = useSubscriptionPrices()
  const [deleteAccountStatus, setDeleteAccountStatus] = useState<
    'idle' | 'confirm' | 'sending' | 'sent' | 'error'
  >('idle')
  const [email, setEmail] = useState('')
  const [magicLinkStatus, setMagicLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // After returning from Stripe checkout, re-fetch the plan
  useEffect(() => {
    if (searchParams.get('upgraded') !== 'true' || !user) return
    const poll = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single()
      if (profile?.plan === 'pro') {
        useAuthStore.setState({ plan: 'pro' })
        setSearchParams({}, { replace: true })
      }
    }
    // Webhook may take a moment — poll a few times
    poll()
    const interval = setInterval(poll, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [searchParams, user])

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
      await sendMagicLink(email.trim(), captchaToken ?? undefined)
      setMagicLinkStatus('sent')
    } catch {
      setMagicLinkStatus('error')
      turnstileRef.current?.reset()
      setCaptchaToken(null)
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

  async function handleUpgrade() {
    setUpgradeStatus('loading')
    try {
      const priceId =
        billingInterval === 'yearly'
          ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
          : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      })
      if (error) throw error
      window.open(data.url, '_self')
    } catch {
      setUpgradeStatus('error')
      setTimeout(() => setUpgradeStatus('idle'), 4000)
    }
  }

  async function handleManageSubscription() {
    setPortalStatus('loading')
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session')
      if (error) throw error
      window.open(data.url, '_self')
    } catch {
      setPortalStatus('error')
      setTimeout(() => setPortalStatus('idle'), 4000)
    }
  }

  async function handleDeleteAccountRequest() {
    if (!user) return
    setDeleteAccountStatus('sending')
    try {
      const { error } = await supabase.functions.invoke('request-account-deletion', {
        body: { user_id: user.id },
      })
      if (error) throw error
      setDeleteAccountStatus('sent')
    } catch {
      setDeleteAccountStatus('error')
      setTimeout(() => setDeleteAccountStatus('idle'), 4000)
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
    plan,
    signOut,
    upgradeStatus,
    billingInterval,
    setBillingInterval,
    portalStatus,
    prices,
    isWebPlatform,
    handleUpgrade,
    handleManageSubscription,
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
    deleteAccountStatus,
    setDeleteAccountStatus,
    handleDeleteAccountRequest,
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
    handleClearLocalData,
  } as const
}

export type { Theme, TimeFormat }
