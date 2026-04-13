import { Crown, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'

export default function SubscriptionSection({
  plan,
  upgradeStatus,
  billingInterval,
  setBillingInterval,
  portalStatus,
  handleUpgrade,
  handleManageSubscription,
}: {
  plan: string | null
  upgradeStatus: 'idle' | 'loading' | 'error'
  billingInterval: 'monthly' | 'yearly'
  setBillingInterval: (v: 'monthly' | 'yearly') => void
  portalStatus: 'idle' | 'loading' | 'error'
  handleUpgrade: () => void
  handleManageSubscription: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Subscription
      </h2>
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)] grain-surface">
        {plan === 'pro' || plan === 'comp' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan === 'comp' ? 'Complimentary' : 'Pro'} plan
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cloud sync and all features enabled
                </p>
              </div>
            </div>
            {plan === 'pro' && (
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
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Free plan</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Upgrade to Pro for cloud sync across all your devices
                </p>
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
              {billingInterval === 'yearly' && (
                <span className="text-xs text-green-600 dark:text-green-400 ml-1.5 font-medium">
                  Save 17%
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
