import { useState } from 'react'
import { getConsent, setConsent } from '../../lib/consent'

export default function PrivacySection() {
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
            className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
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
          <input type="checkbox" checked disabled className="accent-[var(--accent)] w-4 h-4" />
        </div>
        <div className="border-t border-gray-200 dark:border-white/10 pt-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </section>
  )
}
