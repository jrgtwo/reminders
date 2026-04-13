import { useState } from 'react'
import { acceptAll, rejectNonEssential, setConsent, getConsent } from '../lib/consent'

interface Props {
  onDismiss: () => void
}

export default function CookieBanner({ onDismiss }: Props) {
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(getConsent().analytics)

  const handleAcceptAll = () => {
    acceptAll()
    onDismiss()
  }

  const handleReject = () => {
    rejectNonEssential()
    onDismiss()
  }

  const handleSavePreferences = () => {
    setConsent({ analytics })
    onDismiss()
  }

  if (showDetails) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 animate-[slideUp_0.3s_ease-out]">
        <div className="max-w-lg mx-auto rounded-xl bg-[var(--bg-elevated,#1c2128)] border border-[var(--border-color,rgba(255,255,255,0.08))] shadow-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary,rgba(255,255,255,0.9))] mb-4">
            Cookie Preferences
          </h3>

          <div className="space-y-3 mb-5">
            {/* Functional — always on */}
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-primary,rgba(255,255,255,0.8))]">
                  Essential
                </p>
                <p className="text-xs text-[var(--text-secondary,rgba(255,255,255,0.4))]">
                  Required for the app to work (theme, preferences)
                </p>
              </div>
              <input type="checkbox" checked disabled className="accent-[var(--accent)] w-4 h-4" />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm text-[var(--text-primary,rgba(255,255,255,0.8))]">
                  Analytics
                </p>
                <p className="text-xs text-[var(--text-secondary,rgba(255,255,255,0.4))]">
                  Anonymous usage data to help us improve the app
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(false)}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary,rgba(255,255,255,0.6))] hover:bg-[var(--bg-hover,rgba(255,255,255,0.05))] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSavePreferences}
              className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 animate-[slideUp_0.3s_ease-out]">
      <div className="max-w-lg mx-auto rounded-xl bg-[var(--bg-elevated,#1c2128)] border border-[var(--border-color,rgba(255,255,255,0.08))] shadow-2xl p-5">
        <p className="text-sm text-[var(--text-primary,rgba(255,255,255,0.8))] mb-1">
          This site uses cookies
        </p>
        <p className="text-xs text-[var(--text-secondary,rgba(255,255,255,0.6))] mb-4 leading-relaxed">
          We use essential cookies for app functionality and optional analytics cookies to improve
          the experience.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary,rgba(255,255,255,0.6))] hover:bg-[var(--bg-hover,rgba(255,255,255,0.05))] border border-[var(--border-color,rgba(255,255,255,0.08))] transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary,rgba(255,255,255,0.6))] hover:bg-[var(--bg-hover,rgba(255,255,255,0.05))] border border-[var(--border-color,rgba(255,255,255,0.08))] transition-colors"
          >
            Manage
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
