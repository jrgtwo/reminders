import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type PriceInfo = {
  id: string
  amount: number
  currency: string
  interval: 'month' | 'year'
}
export type Prices = { monthly: PriceInfo; yearly: PriceInfo }

const PRICES_CACHE_KEY = 'reminder_subscription_prices_v1'
const PRICES_CACHE_TTL_MS = 24 * 60 * 60 * 1000

type WindowWithPlatformGlobals = {
  electronAPI?: unknown
  Capacitor?: { isNativePlatform?: () => boolean }
}

export const isWebPlatform =
  typeof window !== 'undefined' &&
  !(window as unknown as WindowWithPlatformGlobals).electronAPI &&
  !(window as unknown as WindowWithPlatformGlobals).Capacitor?.isNativePlatform?.()

function readCachedPrices(): { data: Prices; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(PRICES_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data?.monthly?.amount || !parsed?.data?.yearly?.amount) return null
    return parsed
  } catch {
    return null
  }
}

export function useSubscriptionPrices(): Prices | null {
  const [prices, setPrices] = useState<Prices | null>(() => readCachedPrices()?.data ?? null)

  useEffect(() => {
    if (!isWebPlatform) return
    const cached = readCachedPrices()
    const isFresh = cached && Date.now() - cached.fetchedAt < PRICES_CACHE_TTL_MS
    if (isFresh) return

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.functions.invoke('get-subscription-prices')
      if (cancelled || error || !data?.monthly || !data?.yearly) return
      setPrices(data)
      try {
        localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }))
      } catch {
        // localStorage full or unavailable — fine, just skip caching
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return prices
}
