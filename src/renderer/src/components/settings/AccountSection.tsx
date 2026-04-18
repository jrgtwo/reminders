import { useState, useRef } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Turnstile } from '@marsidev/react-turnstile'
import { Check, AlertCircle, LogOut, Mail } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import Button from '../ui/Button'
import { useAuthStore } from '../../store/auth.store'

export default function AccountSection({
  user,
  isLoggedIn,
  signOut,
}: {
  user: User | null
  isLoggedIn: boolean
  signOut: () => void
}) {
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const checkIsReviewerAccount = useAuthStore((s) => s.checkIsReviewerAccount)
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword)
  const [email, setEmail] = useState('')
  const [magicLinkStatus, setMagicLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  )
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [passwordCaptchaToken, setPasswordCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const passwordTurnstileRef = useRef<TurnstileInstance>(null)

  const [passwordMode, setPasswordMode] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [passwordSending, setPasswordSending] = useState(false)

  function resetToInitial() {
    setPasswordMode(false)
    setPassword('')
    setPasswordError(false)
    setPasswordSending(false)
    setMagicLinkStatus('idle')
    setEmail('')
    turnstileRef.current?.reset()
    setCaptchaToken(null)
    passwordTurnstileRef.current?.reset()
    setPasswordCaptchaToken(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    if (passwordMode) {
      if (!password) return
      setPasswordError(false)
      setPasswordSending(true)
      try {
        await signInWithPassword(email.trim(), password, passwordCaptchaToken ?? undefined)
      } catch {
        setPasswordError(true)
        passwordTurnstileRef.current?.reset()
        setPasswordCaptchaToken(null)
      } finally {
        setPasswordSending(false)
      }
      return
    }

    setMagicLinkStatus('sending')
    try {
      const isReviewer = await checkIsReviewerAccount(email.trim())
      if (isReviewer) {
        setMagicLinkStatus('idle')
        setPasswordMode(true)
        turnstileRef.current?.reset()
        setCaptchaToken(null)
        return
      }
      await sendMagicLink(email.trim(), captchaToken ?? undefined)
      setMagicLinkStatus('sent')
    } catch {
      setMagicLinkStatus('error')
      turnstileRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Account
      </h2>
      {isLoggedIn && user ? (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[#f0f0f0] text-sm font-medium">
              {(user.email ?? '?')[0].toUpperCase()}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut size={20} />
            Sign out
          </Button>
        </div>
      ) : magicLinkStatus === 'sent' ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
          <Check size={20} />
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
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              readOnly={passwordMode}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)] ${
                passwordMode
                  ? 'border-gray-200 dark:border-[var(--border)] opacity-50 cursor-default'
                  : 'border-gray-200 dark:border-[var(--border)]'
              }`}
            />
            {passwordMode ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetToInitial}>
                Cancel
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={magicLinkStatus === 'sending' || !captchaToken}
              >
                <Mail size={20} />
                {magicLinkStatus === 'sending' ? 'Sending…' : 'Send link'}
              </Button>
            )}
          </div>
          {passwordMode && (
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(false)
                }}
                placeholder="Password"
                required
                autoFocus
                className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[var(--bg-card)] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                  passwordError
                    ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-[var(--border)] focus:border-[var(--accent-ring)] focus:ring-[var(--accent-ring)]'
                }`}
              />
              <Button type="submit" size="sm" disabled={passwordSending || !password || !passwordCaptchaToken}>
                {passwordSending ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          )}
          {passwordError && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={14} />
              Incorrect password.
            </p>
          )}
          {passwordMode ? (
            <Turnstile
              ref={passwordTurnstileRef}
              siteKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
              onSuccess={setPasswordCaptchaToken}
              onExpire={() => setPasswordCaptchaToken(null)}
              onError={() => setPasswordCaptchaToken(null)}
            />
          ) : (
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          )}
          {magicLinkStatus === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-[#e8a045]">
              <AlertCircle size={20} />
              Failed to send — check your email and try again.
            </p>
          )}
        </form>
      )}
    </section>
  )
}
