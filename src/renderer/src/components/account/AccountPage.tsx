import type { ReactElement } from 'react'
import { ArrowLeft, Cloud, Lock, Smartphone, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button'
import AccountSection from '../settings/AccountSection'
import SubscriptionSection from '../settings/SubscriptionSection'
import { useAccountPage } from './hooks/useAccountPage'

const MARKETING_BULLETS = [
  { icon: Cloud, text: 'Sync your reminders, notes, and lists across web, desktop, and mobile' },
  { icon: Lock, text: 'End-to-end encrypted with AES-256-GCM — only you can read your data' },
  { icon: Smartphone, text: 'Works offline — your data lives on your device first' },
  { icon: ShieldCheck, text: 'No tracking, no ads, no selling your data' }
]

function MarketingBlock(): ReactElement {
  return (
    <ul className="space-y-2.5">
      {MARKETING_BULLETS.map(({ icon: Icon, text }) => (
        <li
          key={text}
          className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
        >
          <Icon size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AccountPage(): ReactElement {
  const {
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
  } = useAccountPage()

  return (
    <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Account</h1>

      {!isLoggedIn && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Why sign up
          </h2>
          <MarketingBlock />
        </section>
      )}

      <AccountSection user={user} isLoggedIn={isLoggedIn} signOut={signOut} />

      {isLoggedIn && (
        <SubscriptionSection
          plan={plan}
          upgradeStatus={upgradeStatus}
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          portalStatus={portalStatus}
          prices={prices}
          isWebPlatform={isWebPlatform}
          handleUpgrade={handleUpgrade}
          handleManageSubscription={handleManageSubscription}
        />
      )}
    </div>
  )
}
