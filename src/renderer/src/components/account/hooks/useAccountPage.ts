import { useEffect, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/auth.store'
import { useSubscriptionPrices, isWebPlatform } from '../lib/prices'
import type { Prices } from '../lib/prices'

type Plan = 'free' | 'pro' | 'comp'
type BillingInterval = 'monthly' | 'yearly'
type AsyncStatus = 'idle' | 'loading' | 'error'

export type UseAccountPageReturn = {
  navigate: NavigateFunction
  user: User | null
  isLoggedIn: boolean
  plan: Plan
  signOut: () => Promise<void>
  prices: Prices | null
  billingInterval: BillingInterval
  setBillingInterval: (v: BillingInterval) => void
  isWebPlatform: boolean
  upgradeStatus: AsyncStatus
  handleUpgrade: () => Promise<void>
  portalStatus: AsyncStatus
  handleManageSubscription: () => Promise<void>
}

export function useAccountPage(): UseAccountPageReturn {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isLoggedIn, plan, signOut } = useAuthStore()

  const prices = useSubscriptionPrices()
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly')
  const [upgradeStatus, setUpgradeStatus] = useState<AsyncStatus>('idle')
  const [portalStatus, setPortalStatus] = useState<AsyncStatus>('idle')

  // After returning from Stripe checkout, re-fetch the plan
  useEffect(() => {
    if (searchParams.get('upgraded') !== 'true' || !user) return
    const poll = async (): Promise<void> => {
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
    poll()
    const interval = setInterval(poll, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [searchParams, user, setSearchParams])

  async function handleUpgrade(): Promise<void> {
    setUpgradeStatus('loading')
    try {
      const priceId =
        billingInterval === 'yearly'
          ? import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
          : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId }
      })
      if (error) throw error
      window.open(data.url, '_self')
    } catch {
      setUpgradeStatus('error')
      setTimeout(() => setUpgradeStatus('idle'), 4000)
    }
  }

  async function handleManageSubscription(): Promise<void> {
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

  return {
    navigate,
    user,
    isLoggedIn,
    plan,
    signOut,
    prices,
    billingInterval,
    setBillingInterval,
    isWebPlatform,
    upgradeStatus,
    handleUpgrade,
    portalStatus,
    handleManageSubscription
  }
}
