import { Crown, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import type { Prices, PriceInfo } from '../account/lib/prices'

function formatPrice(price: PriceInfo): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency.toUpperCase()
  }).format(price.amount / 100)
}

function computeYearlySavings(prices: Prices): number {
  const yearlyEquivalent = prices.monthly.amount * 12
  if (yearlyEquivalent <= 0) return 0
  return Math.round((1 - prices.yearly.amount / yearlyEquivalent) * 100)
}

export default function SubscriptionSection({
  plan,
  upgradeStatus,
  billingInterval,
  setBillingInterval,
  portalStatus,
  prices,
  isWebPlatform,
  handleUpgrade,
  handleManageSubscription
}: {
  plan: string | null
  upgradeStatus: 'idle' | 'loading' | 'error'
  billingInterval: 'monthly' | 'yearly'
  setBillingInterval: (v: 'monthly' | 'yearly') => void
  portalStatus: 'idle' | 'loading' | 'error'
  prices: Prices | null
  isWebPlatform: boolean
  handleUpgrade: () => void
  handleManageSubscription: () => void
}) {
  const isPro = plan === 'pro' || plan === 'comp'
  const savings = prices ? computeYearlySavings(prices) : 0
  const selectedPrice = prices ? prices[billingInterval] : null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Subscription
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
        {isPro ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan === 'comp' ? 'Complimentary' : 'Pro'} plan
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Cloud sync and all features enabled</p>
              </div>
            </div>
            {plan === 'pro' && isWebPlatform && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalStatus === 'loading'}
              >
                <ExternalLink size={20} />
                {portalStatus === 'loading'
                  ? 'Loading…'
                  : portalStatus === 'error'
                    ? 'Failed'
                    : 'Manage'}
              </Button>
            )}
          </div>
        ) : isWebPlatform ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Free plan</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Upgrade to Pro for cloud sync across all your devices
                </p>
                {selectedPrice && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">
                    {formatPrice(selectedPrice)}{' '}
                    <span className="text-xs font-normal text-gray-400">
                      / {selectedPrice.interval}
                    </span>
                  </p>
                )}
              </div>
              <Button size="sm" onClick={handleUpgrade} disabled={upgradeStatus === 'loading'}>
                <Crown size={20} />
                {upgradeStatus === 'loading'
                  ? 'Loading…'
                  : upgradeStatus === 'error'
                    ? 'Failed — try again'
                    : 'Upgrade'}
              </Button>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-[var(--bg-elevated)] w-fit">
              {(['monthly', 'yearly'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setBillingInterval(interval)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    billingInterval === interval
                      ? 'bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {interval === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
              {billingInterval === 'yearly' && savings > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 ml-1.5 font-medium">
                  Save {savings}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Free plan</p>
            <p className="text-xs text-gray-400 mt-0.5">Cloud sync is available on the Pro plan.</p>
          </div>
        )}
      </div>
    </section>
  )
}
